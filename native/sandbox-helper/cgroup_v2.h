#pragma once

#include <stdint.h>

int secure_mail_cgroup_apply(const char *root, const char *name, int pid,
                             uint64_t memory_bytes, uint64_t cpu_ms,
                             uint32_t pids);
int secure_mail_cgroup_cleanup(const char *root, const char *name);
