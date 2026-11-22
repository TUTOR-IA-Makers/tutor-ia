#include <stdio.h>

int main(void) {
    int total_dias, anos, meses, dias;
    scanf("%d", &total_dias);
    anos = total_dias / 365;
    meses = (total_dias % 365) / 30;
    dias = (total_dias % 365) % 30;
    printf("%d\n%d\n%d\n", anos, meses, dias);
    return 0;
}
