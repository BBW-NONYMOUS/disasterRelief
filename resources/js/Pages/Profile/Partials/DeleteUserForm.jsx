import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <Card className={`border-destructive/40 ${className}`}>
            <CardHeader>
                <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-foreground">Delete account</p>
                    <CardDescription>
                        Permanently remove your account and its data. Download anything you want to keep first.
                    </CardDescription>
                </div>
                <Button type="button" variant="destructive" onClick={confirmUserDeletion} className="shrink-0">
                    Delete Account
                </Button>
            </CardContent>

            <Modal show={confirmingUserDeletion} onClose={closeModal} maxWidth="md" title="Delete account">
                <form onSubmit={deleteUser} className="space-y-4 p-6">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold leading-none text-foreground">
                            Delete your account?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            This permanently deletes your account and its data. Enter your password to confirm.
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Password" className="sr-only" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="block w-full"
                            isFocused
                            placeholder="Password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            Delete Account
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}
