import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { moduleNoun } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { ROUTES } from '../routes';
import { primaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

interface CreateButtonProps {
  /** Opens the create page on this module's templates. */
  type?: ProjectType;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const CreateButton: React.FC<CreateButtonProps> = ({ type, label, className = primaryButton, iconOnly }) => {
  const { can } = useWorkspace();
  const navigate = useNavigate();
  if (!can('create:project')) return null;
  const text = label ?? (type ? `New ${moduleNoun(type)}` : 'Create new');

  return (
    <button type="button" className={className} aria-label={iconOnly ? text : undefined} title={iconOnly ? text : undefined} onClick={() => navigate(ROUTES.create(type))}>
      <Plus className="w-4 h-4" aria-hidden="true" />
      {!iconOnly && text}
    </button>
  );
};
