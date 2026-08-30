#pragma once

#include <stddef.h>

int secure_mail_seccomp_install(const char *const *syscalls, size_t count);
