#include <stdio.h>
#include <math.h>

#define PI 3.14159265
#define R 6371.0

int main(void) {
    double lat1, lon1, lat2, lon2;
    scanf("%lf %lf %lf %lf", &lat1, &lon1, &lat2, &lon2);
    
    lat1 = lat1 * PI / 180.0;
    lon1 = lon1 * PI / 180.0;
    lat2 = lat2 * PI / 180.0;
    lon2 = lon2 * PI / 180.0;
    
    double dlat = lat2 - lat1;
    double dlon = lon2 - lon1;
    
    double a = sin(dlat/2.0)*sin(dlat/2.0) + cos(lat1)*cos(lat2)*sin(dlon/2.0)*sin(dlon/2.0);
    double c = 2.0 * asin(sqrt(a));
    
    printf("%.2f\n", R * c);
    return 0;
}
