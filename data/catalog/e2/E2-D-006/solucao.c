#include <stdio.h>

int main(void) {
    int f1, f2, dec;
    scanf("%d %d %d", &f1, &f2, &dec);
    for (int t = f1; t >= f2; t -= dec) {
        double c = 5.0 * (t - 32) / 9.0;
        printf("%d %.2f\n", t, c);
    }
    return 0;
}
