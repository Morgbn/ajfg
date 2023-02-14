import type { ISchema, IUiSchema, IConfigComponent, ISchemaArray, IAnyObject, IErrorObject } from '@/types'

function getType (schema?: ISchema) {
  return !schema ? 'object' : schema.enum ? 'select' : schema.type
}

function getSchema (schema: ISchema, defs: ISchemaArray): ISchema {
  if (!schema.$ref) { return schema }
  const { $ref, ...full } = schema
  const attrs = $ref.split('#')[1].split('/').slice(1)
  let el: IAnyObject = defs
  while (attrs.length && el) { el = el[attrs.shift() as string] }
  if (!el) { throw new Error(`Can not find ${$ref} in defsSchema`) }
  return { ...el, ...full }
}

export function getItemInfo (
  name: string,
  schema: ISchema,
  uiSchema: IUiSchema,
  rootPath: string,
  components: IConfigComponent,
  wrappers: IConfigComponent,
  defsSchema: ISchemaArray,
  errors?: IErrorObject[] | null,
  requiredEls?: string[]
) {
  schema = getSchema(schema, defsSchema)
  const { component: wrapper, props: fWrapper } = wrappers.item
  const wrapperArgs = fWrapper?.(name, schema, uiSchema) ?? {}
  const uiType = uiSchema.uiType ?? getType(schema)
  const path = `${rootPath}/${name}`
  const required = !!requiredEls?.includes(name)
  const error = errors?.find(e => e.instancePath === path)
  const cond = uiSchema.cond ?? null
  const { component, props: f } = components[uiType] ?? components.string
  const args = f?.(name, schema, uiSchema) ?? {}
  if (schema.type === 'array') { args.name = name }
  return { name, component, args, wrapper, wrapperArgs, path, required, error, cond }
}
