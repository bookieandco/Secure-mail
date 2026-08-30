#define _GNU_SOURCE
#include "cgroup_v2.h"
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

static int write_value(const char *dir, const char *file, const char *value) {
    char path[4096];
    int n = snprintf(path, sizeof(path), "%s/%s", dir, file);
    if (n < 0 || (size_t)n >= sizeof(path)) return -1;
    int fd = open(path, O_WRONLY | O_CLOEXEC | O_NOFOLLOW);
    if (fd < 0) return -1;
    size_t len = strlen(value);
    ssize_t written = write(fd, value, len);
    int saved = errno;
    close(fd);
    errno = saved;
    return written == (ssize_t)len ? 0 : -1;
}

int secure_mail_cgroup_apply(const char *root, const char *name, int pid,
                             uint64_t memory_bytes, uint64_t cpu_ms,
                             uint32_t pids) {
    if (!root || !name || pid < 1 || memory_bytes < 1 || cpu_ms < 1 || pids < 1) {
        errno = EINVAL; return -1;
    }
    if (strstr(name, "/") || strstr(name, "..")) { errno = EINVAL; return -1; }
    char dir[4096];
    int n = snprintf(dir, sizeof(dir), "%s/%s", root, name);
    if (n < 0 || (size_t)n >= sizeof(dir)) { errno = ENAMETOOLONG; return -1; }
    if (mkdir(dir, 0700) < 0) return -1;

    char memory[32], cpu[64], pidbuf[32], pidsbuf[32];
    snprintf(memory, sizeof(memory), "%llu", (unsigned long long)memory_bytes);
    snprintf(cpu, sizeof(cpu), "%llu 100000", (unsigned long long)cpu_ms);
    snprintf(pidbuf, sizeof(pidbuf), "%d", pid);
    snprintf(pidsbuf, sizeof(pidsbuf), "%u", pids);

    if (write_value(dir, "memory.max", memory) < 0 ||
        write_value(dir, "pids.max", pidsbuf) < 0 ||
        write_value(dir, "cpu.max", cpu) < 0 ||
        write_value(dir, "cgroup.procs", pidbuf) < 0) {
        secure_mail_cgroup_cleanup(root, name);
        return -1;
    }
    return 0;
}

int secure_mail_cgroup_cleanup(const char *root, const char *name) {
    if (!root || !name || strstr(name, "/") || strstr(name, "..")) { errno = EINVAL; return -1; }
    char dir[4096];
    int n = snprintf(dir, sizeof(dir), "%s/%s", root, name);
    if (n < 0 || (size_t)n >= sizeof(dir)) { errno = ENAMETOOLONG; return -1; }
    return rmdir(dir);
}
