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
import { useMemo, useRef, useState, useEffect } from "react";
import { z } from "zod";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
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
  const [crop, setCrop] = useState<Crop>();
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  const isValidUrl = useMemo(() => z.string().url().safeParse(picture.url).success, [picture.url]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    setImgDimensions({ width, height });

    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // 1:1 aspect ratio
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  };

  const onSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      setCropModalOpen(true);
    }
  };

  const onCropComplete = async () => {
    if (!imgRef.current || !selectedFile || !crop) {
      console.error("Missing required elements:", { imgRef: !!imgRef.current, selectedFile, crop });
      return;
    }

    const canvas = document.createElement("canvas");

    // Get image dimensions
    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;
    const displayWidth = imgRef.current.width;
    const displayHeight = imgRef.current.height;

    // Convert crop coordinates to natural pixels based on unit
    let cropX, cropY, cropWidth, cropHeight;

    if (crop.unit === "%") {
      // If unit is percentage, convert to display pixels first, then scale to natural
      const displayCropX = (crop.x / 100) * displayWidth;
      const displayCropY = (crop.y / 100) * displayHeight;
      const displayCropWidth = (crop.width / 100) * displayWidth;
      const displayCropHeight = (crop.height / 100) * displayHeight;

      cropX = displayCropX * (naturalWidth / displayWidth);
      cropY = displayCropY * (naturalHeight / displayHeight);
      cropWidth = displayCropWidth * (naturalWidth / displayWidth);
      cropHeight = displayCropHeight * (naturalHeight / displayHeight);
    } else {
      // If unit is pixels, the values are already in display pixels, just scale to natural
      cropX = crop.x * (naturalWidth / displayWidth);
      cropY = crop.y * (naturalHeight / displayHeight);
      cropWidth = crop.width * (naturalWidth / displayWidth);
      cropHeight = crop.height * (naturalHeight / displayHeight);
    }

    // Clamp to image bounds
    cropX = Math.max(0, Math.min(cropX, naturalWidth - 1));
    cropY = Math.max(0, Math.min(cropY, naturalHeight - 1));
    cropWidth = Math.max(1, Math.min(cropWidth, naturalWidth - cropX));
    cropHeight = Math.max(1, Math.min(cropHeight, naturalHeight - cropY));

    // Ensure crop coordinates are within image bounds
    if (
      cropX < 0 ||
      cropY < 0 ||
      cropX + cropWidth > naturalWidth ||
      cropY + cropHeight > naturalHeight
    ) {
      console.error("Crop coordinates out of bounds after clamping:", { cropX, cropY, cropWidth, cropHeight });
      return;
    }

    // Since aspect ratio is 1:1, use the smaller dimension for square crop
    const size = Math.min(cropWidth, cropHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Fill with transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adjust source coordinates if cropWidth and cropHeight are not equal
    let sourceX = cropX;
    let sourceY = cropY;
    let sourceSize = size;

    // Center the crop area if necessary
    if (cropWidth > cropHeight) {
      sourceX += (cropWidth - cropHeight) / 2;
      sourceSize = cropHeight;
    } else if (cropHeight > cropWidth) {
      sourceY += (cropHeight - cropWidth) / 2;
      sourceSize = cropWidth;
    }

    // Draw the cropped image
    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    );

    // Convert canvas to blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas");
          return;
        }

        const croppedFile = new File([blob], selectedFile.name, {
          type: selectedFile.type,
          lastModified: Date.now(),
        });

        try {
          const response = await uploadImage(croppedFile);
          const url = response.data;
          setValue("basics.picture.url", url);
        } catch (error) {
          console.error("Failed to upload cropped image:", error);
        }

        setCropModalOpen(false);
        setSelectedFile(null);
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");

        if (inputRef.current) {
          inputRef.current.value = "";
        }
      },
      selectedFile.type,
      1
    );
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>{t`Crop Image`}</DialogTitle>
          <DialogDescription>{t`Adjust the crop area to fit your profile picture.`}</DialogDescription>

          <div className="my-4 max-h-[60vh] overflow-auto text-center">
            {previewUrl && (
              <ReactCrop
                crop={crop}
                onChange={(newCrop) => setCrop(newCrop)}
                circularCrop
                aspect={1}
                className="max-w-full mx-auto"
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt={t`Preview`}
                  className="max-w-full h-auto"
                  onLoad={onImageLoad}
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