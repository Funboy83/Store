"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface CustomField {
  key: string;
  value: string;
}

interface CustomFieldsEditorProps {
  customFields?: Record<string, string>;
  onChange: (customFields: Record<string, string>) => void;
}

export function CustomFieldsEditor({ customFields = {}, onChange }: CustomFieldsEditorProps) {
  // Convert Record to array for easier manipulation
  const [fields, setFields] = useState<CustomField[]>(
    Object.entries(customFields).map(([key, value]) => ({ key, value }))
  );

  const updateFields = (newFields: CustomField[]) => {
    setFields(newFields);
    // Convert back to Record and call onChange
    const customFieldsRecord = newFields.reduce((acc, field) => {
      if (field.key.trim() && field.value.trim()) {
        acc[field.key.trim()] = field.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    onChange(customFieldsRecord);
  };

  const addField = () => {
    updateFields([...fields, { key: "", value: "" }]);
  };

  const removeField = (index: number) => {
    updateFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: Partial<CustomField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    updateFields(newFields);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Custom Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor={`key-${index}`} className="text-xs">
                Field Name
              </Label>
              <Input
                id={`key-${index}`}
                placeholder="e.g., Color, Size, Brand"
                value={field.key}
                onChange={(e) => updateField(index, { key: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`value-${index}`} className="text-xs">
                Value
              </Label>
              <Input
                id={`value-${index}`}
                placeholder="e.g., Red, Large, Sony"
                value={field.value}
                onChange={(e) => updateField(index, { value: e.target.value })}
                className="h-8"
              />
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
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          className="w-full"
        >
          <Plus className="h-3 w-3 mr-2" />
          Add Custom Field
        </Button>
      </CardContent>
    </Card>
  );
}