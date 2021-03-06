import { ValidationError } from '../errors';
import sanitizeFallbackLocale from '../localization/sanitizeFallbackLocale';
import traverseFields from './traverseFields';
import { CollectionConfig } from '../collections/config/types';
import { GlobalConfig } from '../globals/config/types';
import { Operation } from '../types';
import { PayloadRequest } from '../express/types';
import { HookName } from './config/types';

type Arguments = {
  data: Record<string, unknown>
  operation: Operation
  hook: HookName
  req: PayloadRequest
  overrideAccess: boolean
  reduceLocales?: boolean
  originalDoc?: Record<string, unknown>
  id?: string
  showHiddenFields?: boolean
  depth?: number
  currentDepth?: number
}

export default async function performFieldOperations(entityConfig: CollectionConfig | GlobalConfig, args: Arguments): Promise<{ [key: string]: unknown }> {
  const {
    data: fullData,
    originalDoc: fullOriginalDoc,
    operation,
    hook,
    req,
    id,
    req: {
      payloadAPI,
      locale,
    },
    overrideAccess,
    reduceLocales,
    showHiddenFields = false,
  } = args;

  const fallbackLocale = sanitizeFallbackLocale(req.fallbackLocale);

  let depth = 0;

  if (payloadAPI === 'REST' || payloadAPI === 'local') {
    depth = (args.depth || args.depth === 0) ? parseInt(String(args.depth), 10) : this.config.defaultDepth;

    if (depth > this.config.maxDepth) depth = this.config.maxDepth;
  }

  const currentDepth = args.currentDepth || 1;

  // Maintain a top-level list of promises
  // so that all async field access / validations / hooks
  // can run in parallel
  const validationPromises = [];
  const accessPromises = [];
  const relationshipPopulations = [];
  const hookPromises = [];
  const errors: { message: string, field: string }[] = [];

  // //////////////////////////////////////////
  // Entry point for field validation
  // //////////////////////////////////////////

  traverseFields({
    fields: entityConfig.fields, // TODO: Bad typing, this exists
    data: fullData,
    originalDoc: fullOriginalDoc,
    path: '',
    reduceLocales,
    locale,
    fallbackLocale,
    accessPromises,
    operation,
    overrideAccess,
    req,
    id,
    relationshipPopulations,
    depth,
    currentDepth,
    hook,
    hookPromises,
    fullOriginalDoc,
    fullData,
    validationPromises,
    errors,
    payload: this,
    showHiddenFields,
  });

  await Promise.all(hookPromises);

  validationPromises.forEach((promise) => promise());

  await Promise.all(validationPromises);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  await Promise.all(accessPromises);

  const relationshipPopulationPromises = relationshipPopulations.map((population) => population());

  await Promise.all(relationshipPopulationPromises);

  return fullData;
}
