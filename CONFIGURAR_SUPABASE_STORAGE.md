# Configurar Supabase Storage para Imágenes de Productos

## Paso 1: Crear el Bucket en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú izquierdo, haz clic en **Storage**
4. Haz clic en **Create a new bucket**
5. Configura el bucket:
   - **Name**: `product-images`
   - **Public bucket**: Marca esta opción (es importante para que las imágenes sean públicas)
   - **File size limit**: 5MB (o el tamaño que prefieras)
6. Haz clic en **Save**

## Paso 2: Configurar Políticas de Acceso

### Política para Lectura Pública (todos pueden ver las imágenes)

1. En el bucket `product-images`, haz clic en **Policies**
2. Haz clic en **New policy**
3. Selecciona **for viewing**
4. Usa esta plantilla:

```sql
policy "Public Access"
for select
on storage.objects
for authenticated
using ( bucket_id = 'product-images' );
```

O si quieres que sea completamente público:

```sql
policy "Public Access"
for select
on storage.objects
for anon
using ( bucket_id = 'product-images' );
```

### Política para Subida (solo usuarios autenticados pueden subir)

1. Haz clic en **New policy** de nuevo
2. Selecciona **for uploading**
3. Usa esta plantilla:

```sql
policy "Authenticated users can upload"
for insert
on storage.objects
for authenticated
with check ( bucket_id = 'product-images' );
```

### Política para Actualización (sobrescribir imágenes)

1. Haz clic en **New policy** de nuevo
2. Selecciona **for updating**
3. Usa esta plantilla:

```sql
policy "Authenticated users can update"
for update
on storage.objects
for authenticated
with check ( bucket_id = 'product-images' );
```

## Paso 3: Verificar la Configuración

1. En **Storage**, deberías ver tu bucket `product-images`
2. Haz clic en el bucket y deberías ver las políticas configuradas
3. Prueba subiendo una imagen manualmente para verificar que funciona

## Paso 4: URLs Públicas

Las URLs de las imágenes tendrán este formato:
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/product-images/producto1.png
```

Donde:
- `[PROJECT_REF]` es el ID de tu proyecto de Supabase
- `producto1.png` es el nombre del archivo

## Paso 5: Limite de Almacenamiento

- **Plan gratuito**: 1 GB de almacenamiento
- **Plan Pro**: 100 GB de almacenamiento
- Las imágenes de productos suelen pesar entre 50KB y 500KB
- Con 1 GB puedes almacenar aproximadamente 2,000-20,000 imágenes

## Paso 6: Buenas Prácticas

1. **Nombres de archivos**: Usa nombres consistentes como `producto{id}.png`
2. **Tamaño máximo**: Mantén las imágenes por debajo de 5MB
3. **Formatos**: Usa formatos web como WebP, JPG o PNG
4. **Optimización**: Comprime las imágenes antes de subirlas

## Paso 7: Solución de Problemas

### Error "Permission denied"
- Verifica que las políticas estén configuradas correctamente
- Asegúrate de que el bucket sea público

### Error "Bucket not found"
- Verifica que el nombre del bucket sea exactamente `product-images`
- Revisa que hayas creado el bucket en el proyecto correcto

### Error "File too large"
- Aumenta el límite de tamaño del bucket
- Comprime la imagen antes de subirla

## Paso 8: Integración con la Aplicación

Una vez configurado, el sistema funcionará automáticamente:
1. Los empleados suben imágenes desde el panel de admin
2. Las imágenes se guardan en Supabase Storage
3. Las URLs se guardan en la base de datos
4. Las imágenes se muestran inmediatamente en la tienda

¡Listo! Tu sistema de imágenes está configurado y listo para usar.
