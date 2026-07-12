We apply OLS, Random forest and XGBoost to predict the busyness score of restaurants in Manhattan. 

The model consider time effects, restaurant characteristics, traffic flow and location.

Summary of evaluation:

                          train R^2          test R^2     test MAE      testRMSE

OLS                       0.3288             0.2902       20.3736       25.4111

Random Forest             0.6603             0.4510       16.8163       22.3492

XGBoost                   0.7144             0.4791       16.5731       21.7681      
