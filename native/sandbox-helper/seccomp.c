#define _GNU_SOURCE
#include "seccomp.h"

#include <errno.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <stddef.h>
#include <stdint.h>
#include <sys/prctl.h>
#include <sys/syscall.h>
#include <unistd.h>

static int syscall_number(const char *name) {
#define MAP_SYSCALL(n) if (__builtin_strcmp(name, #n) == 0) return SYS_##n
    MAP_SYSCALL(read); MAP_SYSCALL(write); MAP_SYSCALL(close); MAP_SYSCALL(exit); MAP_SYSCALL(exit_group);
    MAP_SYSCALL(brk); MAP_SYSCALL(mmap); MAP_SYSCALL(munmap); MAP_SYSCALL(mprotect); MAP_SYSCALL(rt_sigaction);
    MAP_SYSCALL(rt_sigprocmask); MAP_SYSCALL(futex); MAP_SYSCALL(clock_gettime); MAP_SYSCALL(nanosleep);
#undef MAP_SYSCALL
    return -1;
}

int secure_mail_seccomp_install(const char *const *syscalls, size_t count) {
    if (!syscalls || count == 0 || count > 128) { errno = EINVAL; return -1; }
    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) return -1;

    struct sock_filter filter[131];
    size_t i = 0;
    filter[i++] = (struct sock_filter)BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, arch));
#if defined(__x86_64__)
    filter[i++] = (struct sock_filter)BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, AUDIT_ARCH_X86_64, 1, 0);
#elif defined(__aarch64__)
    filter[i++] = (struct sock_filter)BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, AUDIT_ARCH_AARCH64, 1, 0);
#else
    errno = ENOTSUP; return -1;
#endif
    filter[i++] = (struct sock_filter)BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL_PROCESS);
    filter[i++] = (struct sock_filter)BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, nr));
    for (size_t j = 0; j < count; ++j) {
        int nr = syscall_number(syscalls[j]);
        if (nr < 0) { errno = EINVAL; return -1; }
        filter[i++] = (struct sock_filter)BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, (uint32_t)nr, 0, 1);
        filter[i++] = (struct sock_filter)BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW);
    }
    filter[i++] = (struct sock_filter)BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | EPERM);
    struct sock_fprog program = { .len = (unsigned short)i, .filter = filter };
    return syscall(SYS_seccomp, SECCOMP_SET_MODE_FILTER, 0, &program);
}
