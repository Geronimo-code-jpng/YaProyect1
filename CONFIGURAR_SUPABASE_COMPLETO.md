# Configuración Completa de Supabase para Imágenes de Productos

## Paso 1: Crear la Tabla de Productos

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú izquierdo, haz clic en **Table Editor**
4. Haz clic en **Create a new table**
5. Configura la tabla:

### Configuración de la Tabla

- **Table name**: `productos`
- **Enable Row Level Security (RLS)**: Marcar esta opción

### Columnas de la Tabla

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `Id` | int8 | ID del producto (Primary Key) |
| `nombre` | text | Nombre del producto |
| `precio` | float8 | Precio del producto |
| `Categoria` | text | Categoría del producto |
| `Oferta` | text | Texto de oferta (opcional) |
| `Stock` | bool | Disponibilidad en stock |
| `Imagen` | text | URL de la imagen (opcional) |

### SQL para Crear la Tabla

Si prefieres usar SQL, ejecuta esto en el **SQL Editor**:

```sql
CREATE TABLE productos (
  Id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre text NOT NULL,
  precio float8 NOT NULL,
  Categoria text NOT NULL,
  Oferta text,
  Stock boolean DEFAULT false,
  Imagen text
);

-- Habilitar RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
```

## Paso 2: Crear Políticas de la Tabla

### Política para Lectura (todos pueden ver productos)

1. Ve a **Table Editor** > **productos**
2. Haz clic en **Policies**
3. Haz clic en **New policy**
4. Selecciona **For full customization**
5. Usa esta política:

```sql
policy "Enable read access for all users"
for select
on productos
for anon
using (true);
```

### Política para Inserción/Actualización (solo autenticados)

```sql
policy "Enable insert for authenticated users only"
for insert
on productos
for authenticated
with check (true);

policy "Enable update for authenticated users only"
for update
on productos
for authenticated
using (auth.uid() IS NOT NULL)
with check (auth.uid() IS NOT NULL);
```

## Paso 3: Crear el Bucket de Storage

1. En el menú izquierdo, haz clic en **Storage**
2. Haz clic en **Create a new bucket**
3. Configura el bucket:
   - **Name**: `product-images`
   - **Public bucket**: Marcar esta opción (importante)
   - **File size limit**: 5MB
4. Haz clic en **Save**

## Paso 4: Configurar Políticas de Storage

### Política de Lectura Pública

1. En el bucket `product-images`, haz clic en **Policies**
2. Haz clic en **New policy**
3. Selecciona **for viewing**
4. Usa esta política:

```sql
policy "Public Access"
for select
on storage.objects
for anon
using ( bucket_id = 'product-images' );
```

### Política de Subida (autenticados)

```sql
policy "Authenticated users can upload"
for insert
on storage.objects
for authenticated
with check ( bucket_id = 'product-images' );
```

### Política de Actualización (sobrescribir)

```sql
policy "Authenticated users can update"
for update
on storage.objects
for authenticated
with check ( bucket_id = 'product-images' );
```

## Paso 5: Insertar Datos de Prueba

Usa este SQL en el **SQL Editor** para crear algunos productos de prueba:

```sql
INSERT INTO productos (nombre, precio, Categoria, Oferta, Stock) VALUES
('YERBA SINCERIDAD x10U 500g', 3500, 'YERBA', '', true),
('AZUCAR RRR x10U 500g', 9300, 'ACEITE', '500', true),
('FIDEOS MOLTO x12 500g', 1200, 'ALIMENTO', '', true),
('ACEITE COZINAR 900ml', 4500, 'ACEITE', '', true),
('ARROZ DON ANGELO 1kg', 1800, 'ALIMENTO', '', true);
```

## Paso 6: Verificar Configuración

### Verificar Tabla

1. Ve a **Table Editor** > **productos**
2. Deberías ver los productos insertados
3. La columna `Imagen` debería existir (puede estar vacía)

### Verificar Storage

1. Ve a **Storage**
2. Deberías ver el bucket `product-images`
3. Haz clic en él para verificar que esté vacío

### Verificar Políticas

1. En **productos** > **Policies**: Deberías ver 3 políticas
2. En **Storage** > **product-images** > **Policies**: Deberías ver 3 políticas

## Paso 7: Probar el Sistema

1. Inicia tu aplicación localmente
2. Ve al panel de administración
3. Edita un producto existente
4. Intenta subir una imagen
5. Debería aparecer en Supabase Storage

## Paso 8: URLs de las Imágenes

Las URLs tendrán este formato:
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/product-images/producto1.png
```

Para encontrar tu PROJECT_REF:
1. Ve a **Settings** > **API**
2. Copia el **Project URL** (ej: https://abcdef.supabase.co)
3. Tu PROJECT_REF es `abcdef`

## Paso 9: Solución de Problemas

### Error "relation 'productos' does not exist"
- Asegúrate de haber creado la tabla correctamente
- Verifica que el nombre sea exactamente `productos`

### Error "bucket 'product-images' does not exist"
- Crea el bucket en Storage
- Verifica que el nombre sea exactamente `product-images`

### Error "Permission denied"
- Revisa que todas las políticas estén configuradas
- Asegúrate de que el bucket sea público

### Error "new row violates row-level security policy"
- Verifica las políticas de RLS en la tabla productos
- Asegúrate de que los usuarios autenticados tengan permiso

## Paso 10: Variables de Entorno

Asegúrate de que tu `.env` tenga las variables de Supabase:

```env
VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[TU_ANON_KEY]
```

## Paso 11: Configuración de Vercel

Si usas Vercel, agrega estas variables en **Settings** > **Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## ¡Listo!

Una vez completados estos pasos, tu sistema estará completamente configurado:

1. **Tabla productos** lista con datos de prueba
2. **Storage bucket** configurado con políticas
3. **Sistema de imágenes** funcionando
4. **Panel de admin** listo para usar

Prueba subir una imagen desde el panel de administración y debería funcionar perfectamente.
