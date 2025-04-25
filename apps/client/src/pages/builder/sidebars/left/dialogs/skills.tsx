import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { X } from "@phosphor-icons/react";
import { defaultSkill, skillSchema } from "@reactive-resume/schema";
import {
  Badge,
  BadgeInput,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Slider,
} from "@reactive-resume/ui";
import { AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { SectionDialog } from "../sections/shared/section-dialog";

const formSchema = skillSchema;

type FormValues = z.infer<typeof formSchema>;

export const SkillsDialog = () => {
  const form = useForm<FormValues>({
    defaultValues: defaultSkill,
    resolver: zodResolver(formSchema),
  });

  const [pendingKeyword, setPendingKeyword] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  return (
    <SectionDialog<FormValues>
      id="skills"
      form={form}
      defaultValues={defaultSkill}
      pendingKeyword={pendingKeyword}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t`Name`}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t`Description`}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="level"
          control={form.control}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t`Level`}</FormLabel>
              <FormControl className="py-2">
                <div className="flex items-center gap-x-4">
                  <Slider
                    {...field}
                    min={0}
                    max={5}
                    value={[field.value]}
                    orientation="horizontal"
                    onValueChange={(value) => {
                      field.onChange(value[0]);
                    }}
                  />

                  {field.value > 0 ? (
                    <span className="text-base font-bold">{field.value}</span>
                  ) : (
                    <span className="text-base font-bold">{t`Hidden`}</span>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="keywords"
          control={form.control}
          render={({ field }) => (
            <div className="space-y-3 sm:col-span-2">
              <FormItem>
                <FormLabel>{t`Keywords`}</FormLabel>
                <FormControl>
                  <BadgeInput {...field} setPendingKeyword={setPendingKeyword} />
                </FormControl>
                <FormDescription>
                  {t`You can add multiple keywords by separating them with a comma or pressing enter. Drag to reorder keywords.`}
                </FormDescription>
                <FormMessage />
              </FormItem>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                <Reorder.Group
                  axis="x"
                  values={field.value}
                  className="flex flex-wrap items-center gap-x-2 gap-y-3"
                  onReorder={(newOrder) => {
                    field.onChange(newOrder);
                  }}
                >
                  <AnimatePresence>
                    {field.value.map((item) => (
                      <SkillBadge
                        key={item}
                        item={item}
                        isDragging={draggedItem === item}
                        setDraggedItem={setDraggedItem}
                        onRemove={() => {
                          if (draggedItem !== item) {
                            field.onChange(field.value.filter((v) => item !== v));
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </div>
            </div>
          )}
        />
      </div>
    </SectionDialog>
  );
};

type SkillBadgeProps = {
  item: string;
  onRemove: () => void;
  isDragging: boolean;
  setDraggedItem: (item: string | null) => void;
};

const SkillBadge = ({ item, onRemove, isDragging, setDraggedItem }: SkillBadgeProps) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragControls={dragControls}
      dragListener={false}
      whileDrag={{ scale: 1.05 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="touch-none"
      onDragStart={() => {
        setDraggedItem(item);
      }}
      onDragEnd={() => {
        setDraggedItem(null);
      }}
    >
      <Badge
        className={`cursor-grab ${isDragging ? "ring-2 ring-primary" : ""}`}
        onPointerDown={(e) => {
          e.preventDefault();
          dragControls.start(e);
        }}
        onClick={(e) => {
          if (!isDragging) {
            onRemove();
          }
        }}
      >
        <span className="mr-1">{item}</span>
        <X size={12} weight="bold" className="cursor-pointer" />
      </Badge>
    </Reorder.Item>
  );
};
