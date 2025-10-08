"use client";

import React from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface GeneralInventoryCustomFieldsDisplayProps {
  customFields?: Record<string, string>;
  className?: string;
}

export function GeneralInventoryCustomFieldsDisplay({ customFields = {}, className }: GeneralInventoryCustomFieldsDisplayProps) {
  const fieldEntries = Object.entries(customFields);
  
  if (fieldEntries.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Custom Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fieldEntries.map(([key, value]) => (
            <div key={key} className="flex flex-col space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                {key}
              </span>
              <Badge variant="secondary" className="w-fit">
                {value}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}