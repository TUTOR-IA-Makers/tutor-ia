#include <stdio.h>
#include <math.h>

int main(void) {
    int n;
    scanf("%d", &n);
    double s = 0.0;
    for (int i = 1; i <= n; i++) s += 1.0/i;
    printf("%.6f\n", s);
    double alvo = log((double)n) + 0.5772;
    double acc = 0.0;
    int m = 0;
    while (acc <= alvo) { m++; acc += 1.0/m; }
    printf("%d\n", m);
    return 0;
}
