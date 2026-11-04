#include <stdio.h>

int main(void) {
    double nota;
    scanf("%lf", &nota);
    if (nota >= 9.0)      printf("A\n");
    else if (nota >= 7.0) printf("B\n");
    else if (nota >= 5.0) printf("C\n");
    else                  printf("D\n");
    return 0;
}
