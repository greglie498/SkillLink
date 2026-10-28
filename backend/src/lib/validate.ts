import { z, type ZodError } from "zod";

export function formatZodErrors(error: ZodError): Record<string, string> {
    const out: Record<string, string> ={};
    for(const issue of error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

// For portfolio links: http(s) only
export const httpUrl = z
    .string()
    .trim()
    .max(2048, 'Link is too long.')
    .url('Enter a valid link')
    .refine((v) => /^https?: \/\//i.test(v), 'Only http or https links are allowed');