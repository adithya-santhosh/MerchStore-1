export interface Product{
    id:number;
    name: string;
    description: string;
    price: number;
    category: string;
    ImageURL?: string | null;
    createdAt: string;
    updatedAt: string;
}