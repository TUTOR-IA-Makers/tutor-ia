#include <stdio.h>

int main(void) {
    int t;
    scanf("%d", &t);
    while (t--) {
        int n, s = 0, tmp;
        scanf("%d", &n);
        tmp = n;
        while (tmp > 0) { int d = tmp%10; s += d*d*d; tmp /= 10; }
        printf("%s\n", s == n ? "sim" : "nao");
    }
    return 0;
}
