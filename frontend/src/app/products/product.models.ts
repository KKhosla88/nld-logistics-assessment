export interface Product { id:number; name:string; sku:string; stockQty:number; price:string; }
export interface ProductPage { data:Product[]; pagination:{ page:number; limit:number; total:number; totalPages:number }; }

