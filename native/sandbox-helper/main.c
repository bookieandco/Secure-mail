#include "cgroup_v2.h"
#include "seccomp.h"
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
#if defined(SECURE_MAIL_LINUX)
    if (argc != 7) return 78;
    char *end = NULL;
    long pid = strtol(argv[2], &end, 10); if (*end || pid < 1 || pid > 2147483647L) return 78;
    unsigned long long memory = strtoull(argv[3], &end, 10); if (*end || memory == 0) return 78;
    unsigned long long cpu = strtoull(argv[4], &end, 10); if (*end || cpu == 0) return 78;
    unsigned long pids = strtoul(argv[5], &end, 10); if (*end || pids == 0 || pids > 4294967295UL) return 78;
    if (argv[6][0] != 'D' || argv[6][1] != 'E' || argv[6][2] != 'N' || argv[6][3] != 'Y' || argv[6][4] != '\0') return 78;
    if (secure_mail_cgroup_apply(argv[1], "secure-mail-native", (int)pid, memory, cpu, (unsigned int)pids) != 0) return 78;
    static const char *const allowed[] = { "read", "write", "close", "exit", "exit_group", "brk", "mmap", "munmap", "mprotect", "rt_sigaction", "rt_sigprocmask", "futex", "clock_gettime", "nanosleep" };
    if (secure_mail_seccomp_install(allowed, sizeof(allowed) / sizeof(allowed[0])) != 0) {
        secure_mail_cgroup_cleanup(argv[1], "secure-mail-native");
        return 78;
    }
    return 0;
#else
    (void)argc; (void)argv;
    fputs("secure-mail-sandbox-helper: unsupported platform\n", stderr);
    return 78;
#endif
}
