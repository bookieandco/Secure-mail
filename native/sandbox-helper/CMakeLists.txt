cmake_minimum_required(VERSION 3.20)
project(secure_mail_sandbox_helper C)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

add_executable(secure-mail-sandbox-helper main.c)
target_compile_options(secure-mail-sandbox-helper PRIVATE -Wall -Wextra -Wpedantic -Werror)

if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
  target_compile_definitions(secure-mail-sandbox-helper PRIVATE SECURE_MAIL_LINUX=1)
endif()
