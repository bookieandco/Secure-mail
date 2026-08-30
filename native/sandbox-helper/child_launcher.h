#pragma once

#include <stdint.h>

/*
 * Launches the verified executable as a child. Restrictions are installed
 * in the child before execve. Returns the child PID on success, -1 on error.
 * The parent must treat any setup failure as launch failure.
 */
int secure_mail_spawn_restricted(const char *cgroup_root,
                                 const char *executable,
                                 char *const argv[],
                                 const char *cwd,
                                 uint64_t memory_bytes,
                                 uint64_t cpu_ms,
                                 uint32_t pids);
