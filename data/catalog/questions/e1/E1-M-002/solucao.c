#include <stdio.h>

int main(void) {
    int num, c, d, u, num_inv;
    scanf("%d", &num);
    c = num / 100;
    d = (num % 100) / 10;
    u = num % 10;
    num_inv = u * 100 + d * 10 + c;
    printf("%d\n", num);
    printf("%d\n", num_inv);
    return 0;
}
