import { ProductAttribute } from "@/types/products";
import { Info } from "lucide-react";

interface ProductSpecificationsProps {
  attributes: ProductAttribute[] | undefined;
}

export default function ProductSpecifications({ attributes }: ProductSpecificationsProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
        <Info className="size-4 text-primary" />
        Specifications
      </h3>
      
      <div className="rounded-2xl border border-border bg-card/30 overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border/60">
            {attributes.map((attr, index) => (
              <tr 
                key={attr.id} 
                className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-card/20" : "bg-transparent"}`}
              >
                <td className="py-3 px-4 font-semibold text-muted-foreground w-1/3 border-r border-border/60">
                  {attr.attrKey}
                </td>
                <td className="py-3 px-4 text-foreground">
                  {attr.attrValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
