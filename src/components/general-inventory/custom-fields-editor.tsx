"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { getFieldTemplates } from "@/lib/actions/field-templates";
import { FieldTemplate, CustomFieldValue } from "@/lib/types";

interface CustomField {
  templateId: string;
  fieldName: string;
  label: string;
  fieldType: "Text" | "Number" | "Yes/No" | "Dropdown";
  value: CustomFieldValue;
  options?: string[];
}

interface GeneralInventoryCustomFieldsEditorProps {
  customFields?: Record<string, string>;
  onChange: (customFields: Record<string, string>) => void;
}

export function GeneralInventoryCustomFieldsEditor({ customFields = {}, onChange }: GeneralInventoryCustomFieldsEditorProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<FieldTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load available field templates only once
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await getFieldTemplates();
        setAvailableTemplates(templates);
      } catch (error) {
        console.error("Error loading field templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []); // Only run once on mount

  // Initialize fields from customFields only once when templates are loaded
  useEffect(() => {
    if (!isLoading && !isInitialized && availableTemplates.length >= 0) {
      const existingFields: CustomField[] = Object.entries(customFields).map(([key, value]) => {
        // Try to find a matching template
        const template = availableTemplates.find(t => t.fieldName === key);
        if (template) {
          return {
            templateId: template.id,
            fieldName: template.fieldName,
            label: template.label,
            fieldType: template.fieldType,
            value: convertValueToType(value, template.fieldType),
            options: template.options,
          };
        } else {
          // For backward compatibility, create a text field
          return {
            templateId: "",
            fieldName: key,
            label: key,
            fieldType: "Text" as const,
            value: value,
            options: undefined,
          };
        }
      });
      
      setFields(existingFields);
      setIsInitialized(true);
    }
  }, [isLoading, isInitialized, availableTemplates, customFields]);

  // Convert value to appropriate type based on field type
  const convertValueToType = (value: string, fieldType: "Text" | "Number" | "Yes/No" | "Dropdown"): CustomFieldValue => {
    switch (fieldType) {
      case "Number":
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      case "Yes/No":
        return value.toLowerCase() === "true" || value === "1" || value.toLowerCase() === "yes";
      default:
        return value;
    }
  };

  // Convert CustomField back to Record<string, string> for compatibility
  const updateFields = (newFields: CustomField[]) => {
    setFields(newFields);
    
    // Only call onChange if we're initialized to prevent loops during initial load
    if (isInitialized) {
      const customFieldsRecord = newFields.reduce((acc, field) => {
        if (field.fieldName && field.value !== undefined && field.value !== null && field.value !== "") {
          acc[field.fieldName] = String(field.value);
        }
        return acc;
      }, {} as Record<string, string>);
      
      onChange(customFieldsRecord);
    }
  };

  const addField = () => {
    if (availableTemplates.length === 0) return;
    
    // Add a field with the first available template
    const firstTemplate = availableTemplates[0];
    const newField: CustomField = {
      templateId: firstTemplate.id,
      fieldName: firstTemplate.fieldName,
      label: firstTemplate.label,
      fieldType: firstTemplate.fieldType,
      value: getDefaultValue(firstTemplate.fieldType),
      options: firstTemplate.options,
    };
    
    updateFields([...fields, newField]);
  };

  const getDefaultValue = (fieldType: "Text" | "Number" | "Yes/No" | "Dropdown"): CustomFieldValue => {
    switch (fieldType) {
      case "Number": return 0;
      case "Yes/No": return false;
      default: return "";
    }
  };

  const removeField = (index: number) => {
    updateFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    updateFields(newFields);
  };

  const handleTemplateChange = (index: number, templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    if (!template) return;

    updateField(index, {
      templateId: template.id,
      fieldName: template.fieldName,
      label: template.label,
      fieldType: template.fieldType,
      value: getDefaultValue(template.fieldType),
      options: template.options,
    });
  };

  const renderValueInput = (field: CustomField, index: number) => {
    switch (field.fieldType) {
      case "Number":
        return (
          <Input
            type="number"
            value={field.value as number}
            onChange={(e) => updateField(index, { value: parseFloat(e.target.value) || 0 })}
            className="h-8"
            placeholder="Enter number"
          />
        );
      
      case "Yes/No":
        return (
          <div className="flex items-center space-x-2 h-8">
            <Checkbox
              id={`checkbox-${index}`}
              checked={field.value as boolean}
              onCheckedChange={(checked) => updateField(index, { value: !!checked })}
            />
            <Label htmlFor={`checkbox-${index}`} className="text-sm">
              {field.value ? "Yes" : "No"}
            </Label>
          </div>
        );
      
      case "Dropdown":
        return (
          <Select
            value={field.value as string}
            onValueChange={(value) => updateField(index, { value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, optionIndex) => (
                <SelectItem key={optionIndex} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default: // Text
        return (
          <Input
            value={field.value as string}
            onChange={(e) => updateField(index, { value: e.target.value })}
            className="h-8"
            placeholder="Enter text"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading field templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Custom Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="space-y-2 p-3 border rounded-md">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor={`template-${index}`} className="text-xs">
                  Field Template
                </Label>
                <Select
                  value={field.templateId}
                  onValueChange={(templateId) => handleTemplateChange(index, templateId)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select field template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label} ({template.fieldType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeField(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            {field.templateId && (
              <div>
                <Label className="text-xs">{field.label}</Label>
                {renderValueInput(field, index)}
              </div>
            )}
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          className="w-full"
          disabled={availableTemplates.length === 0}
        >
          <Plus className="h-3 w-3 mr-2" />
          {availableTemplates.length === 0 ? "No field templates available" : "Add Custom Field"}
        </Button>
        
        {availableTemplates.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Create field templates in Settings → Custom Fields to add custom fields here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}