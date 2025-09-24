"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { getFieldTemplates, createFieldTemplate, updateFieldTemplate, deleteFieldTemplate } from "@/lib/actions/field-templates";
import { FieldTemplate, FieldType } from "@/lib/types";

const fieldTemplateSchema = z.object({
  fieldName: z.string().optional(),
  label: z.string().min(1, "Field label is required"),
  fieldType: z.enum(["Text", "Number", "Yes/No", "Dropdown"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
}).refine(
  (data) => {
    if (data.fieldType === "Dropdown") {
      return data.options && data.options.length > 0;
    }
    return true;
  },
  {
    message: "Dropdown fields must have at least one option",
    path: ["options"],
  }
);

type FieldTemplateFormData = z.infer<typeof fieldTemplateSchema>;

export default function CustomFieldsPage() {
  const [fieldTemplates, setFieldTemplates] = useState<FieldTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<FieldTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FieldTemplateFormData>({
    resolver: zodResolver(fieldTemplateSchema),
    defaultValues: {
      fieldName: "",
      label: "",
      fieldType: "Text",
      required: false,
      options: [],
    },
  });

  // Handle options manually since useFieldArray has type issues with our schema
  const [optionInputs, setOptionInputs] = useState<string[]>([""]);

  const addOption = () => {
    setOptionInputs([...optionInputs, ""]);
  };

  const removeOption = (index: number) => {
    const newOptions = optionInputs.filter((_, i) => i !== index);
    setOptionInputs(newOptions);
    form.setValue("options", newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...optionInputs];
    newOptions[index] = value;
    setOptionInputs(newOptions);
    form.setValue("options", newOptions);
  };

  const watchFieldType = form.watch("fieldType");

  useEffect(() => {
    loadFieldTemplates();
  }, []);

  const loadFieldTemplates = async () => {
    try {
      const templates = await getFieldTemplates();
      setFieldTemplates(templates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load field templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (data: FieldTemplateFormData) => {
    const templateData = {
      fieldName: data.fieldName || "",
      label: data.label,
      fieldType: data.fieldType,
      required: data.required,
      options: data.fieldType === "Dropdown" ? data.options : undefined,
    };

    const result = await createFieldTemplate(templateData);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Field template created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      loadFieldTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create field template",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTemplate = async (data: FieldTemplateFormData) => {
    if (!editingTemplate) return;

    const templateData = {
      fieldName: data.fieldName || editingTemplate.fieldName,
      label: data.label,
      fieldType: data.fieldType,
      required: data.required,
      options: data.fieldType === "Dropdown" ? data.options : undefined,
    };

    const result = await updateFieldTemplate(editingTemplate.id, templateData);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Field template updated successfully",
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
      loadFieldTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update field template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this field template?")) {
      return;
    }

    const result = await deleteFieldTemplate(templateId);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Field template deleted successfully",
      });
      loadFieldTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete field template",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setOptionInputs([""]);
    form.reset({
      fieldName: "",
      label: "",
      fieldType: "Text",
      required: false,
      options: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: FieldTemplate) => {
    setEditingTemplate(template);
    const options = template.options || [""];
    setOptionInputs(options.length > 0 ? options : [""]);
    form.reset({
      fieldName: template.fieldName,
      label: template.label,
      fieldType: template.fieldType,
      required: template.required || false,
      options: template.options || [],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FieldTemplateFormData) => {
    if (editingTemplate) {
      handleUpdateTemplate(data);
    } else {
      handleCreateTemplate(data);
    }
  };

  const getFieldTypeColor = (fieldType: FieldType) => {
    switch (fieldType) {
      case "Text":
        return "bg-blue-100 text-blue-800";
      case "Number":
        return "bg-green-100 text-green-800";
      case "Yes/No":
        return "bg-purple-100 text-purple-800";
      case "Dropdown":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Manage pre-defined custom fields that can be used across products.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Field Template" : "Create Field Template"}
              </DialogTitle>
              <DialogDescription>
                Define a custom field template that can be used in product forms.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter field label" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Text">Text</SelectItem>
                          <SelectItem value="Number">Number</SelectItem>
                          <SelectItem value="Yes/No">Yes/No</SelectItem>
                          <SelectItem value="Dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchFieldType === "Dropdown" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Dropdown Options</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    {optionInputs.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          disabled={optionInputs.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit">
                    {editingTemplate ? "Update" : "Create"} Template
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fieldTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.label}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge className={getFieldTypeColor(template.fieldType)}>
                  {template.fieldType}
                </Badge>
                {template.required && (
                  <Badge variant="secondary">Required</Badge>
                )}
                {template.options && template.options.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Options:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.options.map((option, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fieldTemplates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No custom field templates found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first field template to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}