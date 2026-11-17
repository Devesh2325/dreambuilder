import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from '../../app/shared/Pagination';

describe('Pagination Component', () => {
  it('renders summary and controls even when totalPages is 1', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={0}
        totalPages={1}
        totalItems={5}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders multiple pages and switches page on click', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={0}
        totalPages={2}
        totalItems={11}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    const page2Button = screen.getByRole('button', { name: 'Page 2' });
    expect(page2Button).toBeInTheDocument();

    fireEvent.click(page2Button);
    expect(onPageChange).toHaveBeenCalledWith(1);

    const nextButton = screen.getByRole('button', { name: 'Next page' });
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('allows jumping to a specific page number', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={0}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    const jumpInput = screen.getByLabelText('Jump to page');
    fireEvent.change(jumpInput, { target: { value: '4' } });

    const jumpButton = screen.getByRole('button', { name: 'Jump' });
    fireEvent.click(jumpButton);

    expect(onPageChange).toHaveBeenCalledWith(3); // 0-indexed page 4 is index 3
  });

  it('calls onPageSizeChange when rows per page is changed', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        currentPage={0}
        totalPages={2}
        totalItems={11}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByLabelText('Items per page');
    fireEvent.change(select, { target: { value: '20' } });

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('does not render when totalItems is 0', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={0}
        totalPages={1}
        totalItems={0}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
