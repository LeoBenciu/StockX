export class CreateManualReceiptDto {
    items: {
        recipeId: string;
        quantity: number;
        unitPrice?: number;
    }[];
}
