# Comportamiento de Imágenes al Editar Productos

## Regla Principal

**Si un producto ya tiene una imagen y no subes una nueva al editar, la imagen existente se mantiene.**

## Escenarios Posibles

### 1. Editar Producto con Imagen Existente

#### Caso A: No se sube nueva imagen
- **Acción**: Editar precio, nombre, etc. SIN tocar el campo de imagen
- **Resultado**: La imagen existente **se mantiene**
- **Mensaje**: "Producto actualizado exitosamente (imagen mantenida)"

#### Caso B: Se sube nueva imagen
- **Acción**: Editar producto Y subir nueva imagen
- **Resultado**: La imagen existente **se reemplaza** por la nueva
- **Mensaje**: "Producto actualizado exitosamente con nueva imagen"

### 2. Crear Producto Nuevo

#### Caso A: Se sube imagen
- **Acción**: Crear producto con imagen
- **Resultado**: El producto tiene la imagen subida
- **Mensaje**: "Producto creado exitosamente"

#### Caso B: No se sube imagen
- **Acción**: Crear producto sin imagen
- **Resultado**: El producto usa placeholder
- **Mensaje**: "Producto creado exitosamente"

## Flujo Lógico

```javascript
// Al guardar un producto
if (hayNuevaImagenSubida) {
  // Usar la nueva imagen
  dataToSave.Imagen = nuevaImagenUrl;
  mensaje = "con nueva imagen";
} else if (editandoProductoConImagenExistente) {
  // Mantener la imagen existente
  dataToSave.Imagen = imagenExistenteUrl;
  mensaje = "(imagen mantenida)";
} else {
  // No hay imagen (producto nuevo sin imagen)
  // No se incluye el campo Imagen
  mensaje = "";
}
```

## Ejemplos Prácticos

### Ejemplo 1: Cambiar Precio Manteniendo Imagen
```
Producto: "YERBA SINCERIDAD" - $3500 - Imagen: producto1.png
Acción: Cambiar precio a $3600, no subir imagen
Resultado: "YERBA SINCERIDAD" - $3600 - Imagen: producto1.png (sin cambios)
```

### Ejemplo 2: Cambiar Precio y Reemplazar Imagen
```
Producto: "AZUCAR RRR" - $9300 - Imagen: producto2.png
Acción: Cambiar precio a $9500, subir nueva imagen
Resultado: "AZUCAR RRR" - $9500 - Imagen: producto2.png (nueva versión)
```

### Ejemplo 3: Editar Producto Sin Imagen
```
Producto: "FIDEOS MOLTO" - $1200 - Sin imagen
Acción: Cambiar precio a $1300, no subir imagen
Resultado: "FIDEOS MOLTO" - $1300 - Sin imagen (placeholder)
```

## Mensajes de Confirmación

### Según la Acción Realizada

| Acción | Mensaje |
|--------|---------|
| Editar + Nueva Imagen | "Producto actualizado exitosamente con nueva imagen" |
| Editar + Mantener Imagen | "Producto actualizado exitosamente (imagen mantenida)" |
| Editar + Sin Imagen | "Producto actualizado exitosamente" |
| Crear + Con Imagen | "Producto creado exitosamente" |
| Crear + Sin Imagen | "Producto creado exitosamente" |

## Ventajas de Este Comportamiento

### 1. **Seguridad**
- No se pierden imágenes accidentalmente
- Los usuarios pueden editar otros campos sin miedo

### 2. **Intuitivo**
- Si no quieres cambiar la imagen, no la tocas
- Si quieres cambiarla, subes una nueva

### 3. **Eficiente**
- No se suben imágenes innecesariamente
- Se mantiene el ancho de banda

### 4. **Predecible**
- El comportamiento es lógico y esperado
- Los mensajes son claros

## En la Consola

Podrás ver mensajes como:
```
Manteniendo imagen existente: https://supabase.co/storage/v1/object/public/product-images/producto1.png
```

## En la Base de Datos

La columna `Imagen` solo se actualiza si:
- Se sube una nueva imagen, o
- Se mantiene la existente al editar

Si no se toca el campo de imagen, el valor no cambia.

## Resumen

**Regla simple**: Si no subes una nueva imagen, la actual se mantiene. Esto hace que editar productos sea seguro y predecible.
