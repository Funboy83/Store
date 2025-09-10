// src/ai/flows/invoice-summary.ts
'use server';
/**
 * @fileOverview A flow for summarizing invoice items using AI.
 *
 * - summarizeInvoice - A function that handles the invoice summarization process.
 * - InvoiceSummaryInput - The input type for the summarizeInvoice function.
 * - InvoiceSummaryOutput - The return type for the summarizeInvoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvoiceSummaryInputSchema = z.object({
  invoiceItems: z.string().describe('A list of invoice items.'),
});
export type InvoiceSummaryInput = z.infer<typeof InvoiceSummaryInputSchema>;

const InvoiceSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the invoice items.'),
});
export type InvoiceSummaryOutput = z.infer<typeof InvoiceSummaryOutputSchema>;

export async function summarizeInvoice(input: InvoiceSummaryInput): Promise<InvoiceSummaryOutput> {
  return invoiceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'invoiceSummaryPrompt',
  input: {schema: InvoiceSummaryInputSchema},
  output: {schema: InvoiceSummaryOutputSchema},
  prompt: `You are an accounting expert. Please summarize the following invoice items:\n\n{{{invoiceItems}}}`,
});

const invoiceSummaryFlow = ai.defineFlow(
  {
    name: 'invoiceSummaryFlow',
    inputSchema: InvoiceSummaryInputSchema,
    outputSchema: InvoiceSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
