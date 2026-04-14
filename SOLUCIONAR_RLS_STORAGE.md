# Solución Rápida: Error de Row Level Security en Supabase Storage

## Problema

```
Error: new row violates row-level security policy
```

Este error ocurre porque las políticas de acceso al Storage no están configuradas correctamente.

## Solución Inmediata

### Paso 1: Crear el Bucket (si no existe)

1. Ve a **Storage** en el panel de Supabase
2. Haz clic en **Create a new bucket**
3. **Name**: `product-images`
4. **Public bucket**: Marcar esta opción
5. **File size limit**: 5MB
6. Haz clic en **Save**

### Paso 2: Configurar Políticas Correctas

1. En el bucket `product-images`, haz clic en **Policies**
2. Si ya existen políticas, elimínalas todas
3. Haz clic en **New policy** y crea estas 4 políticas:

#### Política 1: Lectura Pública

```sql
policy "Public Access"
for select
on storage.objects
for anon
using ( bucket_id = 'product-images' );
```

#### Política 2: Subida para Autenticados

```sql
policy "Authenticated users can upload"
for insert
on storage.objects
for authenticated
with check ( bucket_id = 'product-images' );
```

#### Política 3: Actualización para Autenticados

```sql
policy "Authenticated users can update"
for update
on storage.objects
for authenticated
using ( bucket_id = 'product-images' )
with check ( bucket_id = 'product-images' );
```

#### Política 4: Eliminación para Autenticados

```sql
policy "Authenticated users can delete"
for delete
on storage.objects
for authenticated
using ( bucket_id = 'product-images' );
```

### Paso 3: Verificar Configuración

1. Ve a **Storage** > **product-images**
2. Deberías ver el bucket
3. Haz clic en **Policies** - deberías ver 4 políticas
4. Intenta subir una imagen desde el admin

## Solución Alternativa (Si lo anterior no funciona)

### Desactivar RLS Temporalmente

Si sigues teniendo problemas, puedes desactivar RLS temporalmente:

```sql
-- Desactivar RLS para Storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Subir tus imágenes de prueba
-- Luego volver a activar RLS con las políticas correctas
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## Verificación Final

Después de configurar:

1. **Ve al admin de productos**
2. **Edita un producto**
3. **Sube una imagen**
4. **Debería funcionar sin errores**

## Errores Comunes y Soluciones

### Error: "bucket does not exist"
- **Solución**: Crea el bucket `product-images` manualmente

### Error: "permission denied"
- **Solución**: Revisa que todas las políticas estén configuradas

### Error: "new row violates row-level security policy"
- **Solución**: Las políticas no permiten la inserción, usa las políticas de arriba

### Error: "JWT is invalid"
- **Solución**: Refresca la página o reinicia sesión

## URLs de Prueba

Después de configurar, las imágenes deberían aparecer con URLs como:
```
https://vcbqhwxlwmhwdbcplgbj.supabase.co/storage/v1/object/public/product-images/producto2.png
```

## Resumen

1. **Crear bucket** `product-images`
2. **Configurar 4 políticas** (SELECT, INSERT, UPDATE, DELETE)
3. **Probar subida** desde el admin
4. **Verificar** que las imágenes aparezcan

¡Con esto debería funcionar perfectamente!
