#include <stdio.h>

int main(void) {
    int num;
    scanf("%d", &num);
    printf("%d\n", (num + 1) % 61);
    return 0;
}
