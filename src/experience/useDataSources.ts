import { useEffect, useMemo, useState } from 'react';
import { DataRow, dataKey, DataSource, fetchRows } from '../core/dataSources';
import { ProjectSettings } from '../core/schema';
import { VariableValues } from '../core/variables';

// Shared between the canvas, previews and panels, so one address is fetched once a minute.
const cache = new Map<string, { at: number; promise: Promise<DataRow[]> }>();
const FRESH_MS = 60_000;

const cacheKey = (source: Pick<DataSource, 'url' | 'path'>) => `${source.url}|${source.path ?? ''}`;

export function loadRows(source: Pick<DataSource, 'url' | 'path'>, refresh = false): Promise<DataRow[]> {
  const key = cacheKey(source);
  const hit = cache.get(key);
  if (hit && !refresh && Date.now() - hit.at < FRESH_MS) return hit.promise;
  const promise = fetchRows(source);
  cache.set(key, { at: Date.now(), promise });
  promise.catch(() => cache.delete(key));
  return promise;
}

export interface DataState {
  values: Record<string, DataRow[]>;
  errors: Record<string, string>;
  isLoading: boolean;
}

/** Each source's rows, keyed as its list variable. A failed source just shows nothing. */
export function useDataSources(sources: DataSource[] | undefined): DataState {
  const [state, setState] = useState<DataState>({ values: {}, errors: {}, isLoading: false });
  const signature = JSON.stringify((sources ?? []).map((source) => [source.key, source.url, source.path]));

  useEffect(() => {
    const list = sources ?? [];
    if (list.length === 0) {
      setState({ values: {}, errors: {}, isLoading: false });
      return undefined;
    }
    let active = true;
    setState((previous) => ({ ...previous, isLoading: true }));
    Promise.all(list.map(async (source) => {
      try {
        return [source.key, await loadRows(source), null] as const;
      } catch (error) {
        return [source.key, [] as DataRow[], error instanceof Error ? error.message : 'Could not load'] as const;
      }
    })).then((results) => {
      if (!active) return;
      setState({
        values: Object.fromEntries(results.map(([key, rows]) => [dataKey(key), rows])),
        errors: Object.fromEntries(results.filter(([, , error]) => error).map(([key, , error]) => [key, error!])),
        isLoading: false,
      });
    });
    return () => {
      active = false;
    };
    // The signature covers what matters in the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return state;
}

/** The project's own values, plus whatever its data sources loaded. */
export function useVariablesWithData(variables: VariableValues | undefined, settings: ProjectSettings | undefined): VariableValues {
  const { values } = useDataSources(settings?.dataSources);
  return useMemo(() => (Object.keys(values).length ? { ...(variables ?? {}), ...values } : variables ?? {}), [variables, values]);
}
