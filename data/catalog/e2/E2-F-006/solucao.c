#include <stdio.h>

int main(void) {
    int n, count = 0;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++)
        if (i % 2 == 0 || i % 5 == 0) count++;
    printf("%d\n", count);
    return 0;
}
