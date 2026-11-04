#include <stdio.h>

int main(void) {
    int a, b, temp;
    scanf("%d %d", &a, &b);
    while (b != 0) {
        temp = b;
        b = a % b;
        a = temp;
    }
    printf("%d\n", a);
    return 0;
}
