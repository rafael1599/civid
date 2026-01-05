import { router } from '@inertiajs/react';

export default function useDeleteResource() {
    const deleteResource = (url, { title = 'este elemento', content = null, onSuccess = () => {}, onFinish = () => {} } = {}) => {
        if (confirm(`¿Estás seguro de que deseas eliminar ${title}?`)) {
            router.delete(url, {
                preserveScroll: true,
                onSuccess: (page) => {
                    if (onSuccess) onSuccess(page);
                },
                onFinish: () => {
                   if (onFinish) onFinish();
                }
            });
        }
    };

    return { deleteResource };
}
