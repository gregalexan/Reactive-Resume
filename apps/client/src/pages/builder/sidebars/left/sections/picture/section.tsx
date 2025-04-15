import { t } from "@lingui/macro";
import { Aperture, Trash, UploadSimple, Check, X } from "@phosphor-icons/react";
import {
  Avatar,
  AvatarImage,
  buttonVariants,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Button,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { useUploadImage } from "@/client/services/storage";
import { useResumeStore } from "@/client/stores/resume";

import { PictureOptions } from "./options";

export const PictureSection = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { uploadImage } = useUploadImage();

  const setValue = useResumeStore((state) => state.setValue);
  const picture = useResumeStore((state) => state.resume.data.basics.picture);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });

  const isValidUrl = useMemo(() => z.string().url().safeParse(picture.url).success, [picture.url]);

  const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the crop modal
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Show the crop modal
      setCropModalOpen(true);
    }
  };

  const onCropComplete = async () => {
    if (!imgRef.current || !selectedFile) return;

    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      // Create a new file from the blob
      const croppedFile = new File([blob], selectedFile.name, {
        type: selectedFile.type,
        lastModified: Date.now(),
      });
      
      // Upload the cropped image
      const response = await uploadImage(croppedFile);
      const url = response.data;
      
      // Update the picture URL
      setValue("basics.picture.url", url);
      
      // Clean up
      setCropModalOpen(false);
      setSelectedFile(null);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }, selectedFile.type);
  };

  const onCancelCrop = () => {
    setCropModalOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const onAvatarClick = () => {
    if (isValidUrl) {
      setValue("basics.picture.url", "");
    } else {
      inputRef.current?.click();
    }
  };

  return (
    <>
      <div className="flex items-center gap-x-4">
        <div className="group relative cursor-pointer" onClick={onAvatarClick}>
          <Avatar className="size-14 bg-secondary">
            <AvatarImage src={picture.url} />
          </Avatar>

          {isValidUrl ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Trash size={16} weight="bold" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/30 opacity-0 transition-opacity group-hover:opacity-100">
              <UploadSimple size={16} weight="bold" />
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-y-1.5">
          <Label htmlFor="basics.picture.url">{t`Picture`}</Label>
          <div className="flex items-center gap-x-2">
            <input ref={inputRef} hidden type="file" accept="image/*" onChange={onSelectImage} />

            <Input
              id="basics.picture.url"
              placeholder="https://..."
              value={picture.url}
              onChange={(event) => {
                setValue("basics.picture.url", event.target.value);
              }}
            />

            {isValidUrl && (
              <Popover>
                <PopoverTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(buttonVariants({ size: "icon", variant: "ghost" }))}
                  >
                    <Aperture />
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px]">
                  <PictureOptions />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>{t`Crop Image`}</DialogTitle>
          <DialogDescription>{t`Adjust the crop area to fit your profile picture.`}</DialogDescription>
          
          <div className="my-4 max-h-[60vh] overflow-hidden text-center">
            {previewUrl && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                circularCrop
                aspect={1}
              >
                <img 
                  ref={imgRef} 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full h-auto"
                />
              </ReactCrop>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancelCrop}>
              <X className="mr-2 h-4 w-4" /> {t`Cancel`}
            </Button>
            <Button onClick={onCropComplete}>
              <Check className="mr-2 h-4 w-4" /> {t`Apply`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};