# Tipos Compartidos - TypeScript

Este directorio contiene los tipos compartidos para toda la aplicación.

## 📁 Archivos

- `index.ts` - Tipos principales e interfaces globales

## 🎯 Tipos Definidos

### `Product`
```typescript
interface Product {
  Id: number;
  nombre: string;
  Categoria: string;
  precio: number;
  Stock: boolean;
  Imagen?: string;
  imagen?: string;
  Oferta?: string;
}
```

### `User`
```typescript
interface User {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
}
```

### `UserProfile`
```typescript
interface UserProfile {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  cantidad_pedidos?: number;
}
```

### `Order`
```typescript
interface Order {
  id: string;
  userId: string;
  items: Product[];
  total: number;
  estado: string;
  metodoEntrega: string;
  direccion?: string;
  telefono?: string;
  notas?: string;
  fuente: string;
  creado_en?: string;
  actualizado_en?: string;
}
```

### `CartItem`
```typescript
interface CartItem extends Product {
  cantidad: number;
}
```

### `UserSession`
```typescript
interface UserSession {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  isLoggedIn: boolean;
  loginTime: string;
}
```

## 🌐 Extensiones Globales

### `Window`
```typescript
declare global {
  interface Window {
    productManager?: {
      verTodos: () => Promise<Product[]>;
      eliminarPorId: (id: number) => Promise<boolean>;
      eliminarTodos: () => Promise<boolean>;
      exportar: () => Promise<string | null>;
    };
  }
}
```

## 🔧 Uso

Para usar estos tipos en cualquier archivo:

```typescript
import { Product, User, UserProfile, Order, CartItem, UserSession } from '../types';
```

## 📝 Beneficios

- ✅ **Consistencia** - Mismos tipos en toda la app
- ✅ **Autocompletado** - Mejor soporte en IDE
- ✅ **Refactorización** - Fácil de mantener y actualizar
- ✅ **Type Safety** - Menos errores en tiempo de ejecución

## 🚀 Actualizaciones

Cuando se agreguen nuevos tipos:
1. Actualizar `index.ts`
2. Documentar aquí mismo
3. Actualizar archivos que usan los tipos
