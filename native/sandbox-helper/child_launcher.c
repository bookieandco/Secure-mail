#define _GNU_SOURCE
#include "child_launcher.h"
#include "cgroup_v2.h"
#include "seccomp.h"

#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

static void fail_child(int fd) {
    int error = errno;
    (void)!write(fd, &error, sizeof(error));
    _exit(78);
}

int secure_mail_spawn_restricted(const char *cgroup_root, const char *executable, char *const argv[], const char *cwd, uint64_t memory_bytes, uint64_t cpu_ms, uint32_t pids, const char *seccomp_profile) {
    if (!cgroup_root || !executable || !argv || !argv[0] || !cwd || !seccomp_profile || memory_bytes == 0 || cpu_ms == 0 || pids == 0) { errno = EINVAL; return -1; }
    const char *const *syscalls = NULL; size_t syscall_count = 0;
    if (secure_mail_seccomp_profile(seccomp_profile, &syscalls, &syscall_count) != 0) return -1;
    int admission[2];
    if (pipe2(admission, O_CLOEXEC) != 0) return -1;
    pid_t child = fork();
    if (child < 0) { close(admission[0]); close(admission[1]); return -1; }
    if (child == 0) {
        close(admission[0]);
        if (chdir(cwd) != 0) fail_child(admission[1]);
        if (secure_mail_cgroup_apply(cgroup_root, "secure-mail-native-child", getpid(), memory_bytes, cpu_ms, pids) != 0) fail_child(admission[1]);
        if (secure_mail_seccomp_install(syscalls, syscall_count) != 0) fail_child(admission[1]);
        execv(executable, argv);
        fail_child(admission[1]);
    }
    close(admission[1]);
    int child_error = 0;
    ssize_t n = read(admission[0], &child_error, sizeof(child_error));
    close(admission[0]);
    if (n == 0) return (int)child;
    kill(child, SIGKILL);
    (void)waitpid(child, NULL, 0);
    if (n == (ssize_t)sizeof(child_error)) { errno = child_error; return -1; }
    errno = EPROTO;
    return -1;
}
