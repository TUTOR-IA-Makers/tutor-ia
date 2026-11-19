#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    int maiorAB = (a + b + abs(a - b)) / 2;
    int maiorABC = (maiorAB + c + abs(maiorAB - c)) / 2;
    printf("%d\n", maiorABC);
    return 0;
}
