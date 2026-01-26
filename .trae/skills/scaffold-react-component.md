# Skill: Scaffold React Component (Next.js)
Description: Cria um componente React funcional com Typescript, Tailwind e padrão de exportação.

## Trigger
Use esta skill quando o usuário pedir para "criar um componente", "novo componente de UI" ou "componente visual" no frontend.

## Parameters
- `name`: Nome do componente (PascalCase).
- `path`: Caminho relativo ou absoluto onde criar (ex: `apps/ambra-flow/src/components/ui`).
- `props`: (Opcional) Lista de props iniciais.

## Actions
1. **Validar Caminho**: Verifique se o caminho existe. Se não, sugira o caminho padrão `src/components`.
2. **Criar Arquivo**: Crie `[name].tsx`.
3. **Template**:
   ```tsx
   import { cn } from "@/lib/utils"; // Ajuste o import conforme o alias do projeto

   interface [Name]Props extends React.HTMLAttributes<HTMLDivElement> {
     // Props personalizadas aqui
   }

   export function [Name]({ className, ...props }: [Name]Props) {
     return (
       <div className={cn("base-styles", className)} {...props}>
         {/* Content */}
       </div>
     );
   }
   ```
4. **Verificar Alias**: Verifique se `@/lib/utils` é o alias correto para `cn` (clsx + tailwind-merge) no projeto atual (`tsconfig.json`).
