#define _GNU_SOURCE
#include "child_launcher.h"
#include "cgroup_v2.h"
#include "seccomp.h"

#include <errno.h>
#include <signal.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

static int fail_child(void) {
    _exit(78);
}

int secure_mail_spawn_restricted(const char *cgroup_root,
                                 const char *executable,
                                 char *const argv[],
                                 const char *cwd,
                                 uint64_t memory_bytes,
                                 uint64_t cpu_ms,
                                 uint32_t pids) {
    if (!cgroup_root || !executable || !argv || !argv[0] || !cwd || memory_bytes == 0 || cpu_ms == 0 || pids == 0) {
        errno = EINVAL;
        return -1;
    }

    int ready[2];
    if (pipe(ready) != 0) return -1;
    pid_t child = fork();
    if (child < 0) { close(ready[0]); close(ready[1]); return -1; }

    if (child == 0) {
        close(ready[0]);
        if (chdir(cwd) != 0) fail_child();

        /* The child is not exec'd until the required controls are installed. */
        if (secure_mail_cgroup_apply(cgroup_root, "secure-mail-native-child", getpid(), memory_bytes, cpu_ms, pids) != 0) fail_child();
        static const char *const allowed[] = { "read", "write", "close", "exit", "exit_group", "brk", "mmap", "munmap", "mprotect", "rt_sigaction", "rt_sigprocmask", "futex", "clock_gettime", "nanosleep" };
        if (secure_mail_seccomp_install(allowed, sizeof(allowed) / sizeof(allowed[0])) != 0) fail_child();
        const char ok = 1;
        if (write(ready[1], &ok, 1) != 1) fail_child();
        close(ready[1]);
        execv(executable, argv);
        _exit(78);
    }

    close(ready[1]);
    char status = 0;
    ssize_t n = read(ready[0], &status, 1);
    close(ready[0]);
    if (n != 1 || status != 1) {
        kill(child, SIGKILL);
        (void)waitpid(child, NULL, 0);
        return -1;
    }
    return (int)child;
}
