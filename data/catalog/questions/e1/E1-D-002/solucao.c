#include <stdio.h>

int main(void) {
    int n, n100, n50, n20, n10, n5, n2, n1;
    scanf("%d", &n);
    n100 = n / 100;
    n %= 100;
    n50 = n / 50;
    n %= 50;
    n20 = n / 20;
    n %= 20;
    n10 = n / 10;
    n %= 10;
    n5 = n / 5;
    n %= 5;
    n2 = n / 2;
    n1 = n % 2;
    printf("%d\n%d\n%d\n%d\n%d\n%d\n%d\n", n100, n50, n20, n10, n5, n2, n1);
    return 0;
}
