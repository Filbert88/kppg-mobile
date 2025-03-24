# kuzram.py
import numpy as np
import math

def kuz_ram_model(A, K, Q, E, n):
    X50 = A * Q**(0.17) * (115 / E)**(0.63) * K**(-0.8)
    Xc = X50 / (0.693)**(1/n)
    sizes = np.linspace(1, 3 * X50, 100)
    distribution = 100 * (1 - np.exp(- (sizes / Xc)**n))
    
    def get_percentile(percentile):
        indices = np.where(distribution >= percentile)[0]
        if len(indices) > 0:
            return sizes[indices[0]]
        return None
    
    P10 = get_percentile(10)
    P20 = get_percentile(20)
    P80 = get_percentile(80)
    P90 = get_percentile(90)
    TopSize = get_percentile(99)
    below_60 = np.where(sizes <= 60)[0][-1]
    percentage_below_60 = distribution[below_60]
    percentage_above_60 = 100 - percentage_below_60

    return {
        "X50": float(X50),
        "P10": float(P10) if P10 is not None else None,
        "P20": float(P20) if P20 is not None else None,
        "P80": float(P80) if P80 is not None else None,
        "P90": float(P90) if P90 is not None else None,
        "TopSize": float(TopSize) if TopSize is not None else None,
        "percentage_below_60": float(percentage_below_60),
        "percentage_above_60": float(percentage_above_60)
    }

# For standalone testing, uncomment below:
# if __name__ == '__main__':
#     A = 5.955  
#     K = 0.139  
#     Q = 66.725  
#     E = 100    
#     n = 1.851  
#     result = kuz_ram_model(A, K, Q, E, n)
#     print(result)
