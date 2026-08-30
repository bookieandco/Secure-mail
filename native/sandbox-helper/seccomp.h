#pragma once

#include <stddef.h>

/* Resolves a policy-owned profile name to an immutable syscall allowlist. */
int secure_mail_seccomp_profile(const char *profile,
                                const char *const **syscalls,
                                size_t *count);

int secure_mail_seccomp_install(const char *const *syscalls, size_t count);
