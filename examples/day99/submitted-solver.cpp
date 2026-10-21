
#include <iostream>
#include <fstream>
#include <map>
#include <vector>
#include <sstream>
#include <cstdint>
#include <algorithm>

struct Village {
     int64_t bucketsToStore = 0;
     bool storingWells = false;
     bool storedExchange = false;
};

struct CurrentConfig {
     int64_t villagesLeft = -1;
     int64_t waterGoal = -1;
     int64_t allowance = -1;
     int64_t waterStored = 0;
     int64_t waterCapacity = 0;

     std::vector<int64_t> buckets = {};
};

struct Trip {
     std::vector<std::vector<int64_t>> boughtBuckets = {};
     std::vector<std::vector<int64_t>> paidWells = {};
     std::vector<std::vector<int64_t>*> exchanges = {};
     std::vector<std::vector<int64_t>> buckets = {};
     std::vector<int64_t> freeWells = {};

     CurrentConfig* currConfig;
};

std::vector<Trip*> Trips = {};

int64_t binarySearchExchanges(Trip* currTrip, int64_t x, int64_t l, int64_t h){
     int64_t mid = (l + h) / 2;
     std::vector<int64_t>* exchange;
     int64_t compVal;

     if (currTrip->exchanges.empty()){ return 0; }
     if (h <= l){
          exchange = currTrip->exchanges.at(l);
          compVal = exchange->at(0)/exchange->at(1);
          return ((compVal > x)? l : l + 1);
     }
     exchange = currTrip->exchanges.at(mid);
     compVal = exchange->at(0)/exchange->at(1);

     if (compVal == x || (compVal <= x && x <= currTrip->exchanges.at(mid + 1)->at(0)/currTrip->exchanges.at(mid+1)->at(1))){
          return mid + 1;
     }
     if (x < compVal){ return binarySearchExchanges(currTrip, x, l, mid - 1); }
     return binarySearchExchanges(currTrip, x, mid + 1, h);
}

void insertExchange(Trip* currTrip, std::vector<int64_t>* exchange){
     int64_t index = binarySearchExchanges(currTrip, exchange->at(0)/exchange->at(1), 0, currTrip->exchanges.size() - 1);
     std::vector<std::vector<int64_t>*> frontExchanges = {};
     std::vector<std::vector<int64_t>*> endExchanges = {exchange};

     if (index == 0){
          std::copy(currTrip->exchanges.begin(), currTrip->exchanges.end(), std::back_inserter(endExchanges));
          currTrip->exchanges = endExchanges;
          return;
     }
     if (index == currTrip->exchanges.size()){
          currTrip->exchanges.push_back(exchange);
          return;
     }

     std::copy(currTrip->exchanges.begin(), currTrip->exchanges.begin() + index, std::back_inserter(frontExchanges));
     std::copy(currTrip->exchanges.begin() + index, currTrip->exchanges.end(), std::back_inserter(endExchanges));

     std::copy(endExchanges.begin(), endExchanges.end(), std::back_inserter(frontExchanges));
     currTrip->exchanges = frontExchanges;
}

int64_t purchaseExchanges(CurrentConfig* curr, Trip* currTrip, int64_t currentGain, int64_t startIndex){
     for (int64_t i = startIndex; i >= 0; i--){
          std::vector<int64_t>* exchange = currTrip->exchanges.at(i);
          int64_t exchangesLeft = exchange->at(2);

          if (curr->waterStored >= curr->waterGoal){ break; }
          if (curr->waterStored - exchange->at(1) < 0){ continue; }
          if (exchangesLeft == 0){
               currTrip->exchanges.erase(currTrip->exchanges.begin() + i);
               continue;
          }

          currentGain += exchange->at(0);
          curr->waterStored -= exchange->at(1);
          exchange->pop_back();
          exchange->push_back(exchangesLeft - 1);

          currentGain = purchaseExchanges(curr, currTrip, currentGain, i - 1);
          i = (i >= currTrip->exchanges.size())? currTrip->exchanges.size() - 1 : i - 1;
     }

     return currentGain;
}

int64_t binarySearchWells(Trip* currTrip, int64_t x, int64_t l, int64_t h){
     if (currTrip->paidWells.empty()){ return 0; }
     if (h <= l){
          return ((currTrip->paidWells.at(l).at(1) > x)? l : l + 1);
     }

     int64_t mid = (l + h) / 2;

     if (currTrip->paidWells.at(mid).at(1) == x || (currTrip->paidWells.at(mid).at(1) <= x && x <= currTrip->paidWells.at(mid + 1).at(1))){
          return mid + 1;
     }
     if (x < currTrip->paidWells.at(mid).at(1)){ return binarySearchWells(currTrip, x, l, mid - 1); }
     return binarySearchWells(currTrip, x, mid + 1, h);
}

void insertWell(Trip* currTrip, std::vector<int64_t> well){
     int64_t index = binarySearchWells(currTrip, well.at(1), 0, currTrip->paidWells.size() - 1);
     std::vector<std::vector<int64_t>> frontWells = {};
     std::vector<std::vector<int64_t>> endWells = {well};

     if (index == 0){
          std::copy(currTrip->paidWells.begin(), currTrip->paidWells.end(), std::back_inserter(endWells));
          currTrip->paidWells = endWells;
          return;
     }
     if (index == currTrip->paidWells.size()){
          currTrip->paidWells.push_back(well);
          return;
     }

     std::copy(currTrip->paidWells.begin(), currTrip->paidWells.begin() + index, std::back_inserter(frontWells));
     std::copy(currTrip->paidWells.begin() + index, currTrip->paidWells.end(), std::back_inserter(endWells));

     std::copy(endWells.begin(), endWells.end(), std::back_inserter(frontWells));
     currTrip->paidWells = frontWells;
}

int64_t purchaseWells(CurrentConfig* curr, Trip* currTrip, int64_t currentCost, int64_t startIndex){
     for (int64_t i = startIndex; i >= 0; i--){
          std::vector<int64_t> well = currTrip->paidWells.at(i);
          if (curr->waterGoal <= 0){ break; }
          if (curr->allowance - currentCost < well.at(1)){ continue; }
          if (well.at(0) + curr->waterStored > curr->waterCapacity) { continue; }

          currentCost += well.at(1);
          curr->waterStored += well.at(0);

          currTrip->paidWells.erase(currTrip->paidWells.begin() + i);
          currentCost = purchaseWells(curr, currTrip, currentCost, i - 1);

          i = (i >= currTrip->paidWells.size())? currTrip->paidWells.size() - 1 : i - 1;
     }

     return currentCost;
}

void getFreeWater(CurrentConfig* curr, Trip* currTrip){
     for (size_t i = 0; i < currTrip->freeWells.size(); i++){
          int64_t water = currTrip->freeWells.at(i);

          if (water + curr->waterStored > curr->waterCapacity){
               curr->waterStored = curr->waterCapacity;
               currTrip->freeWells.push_back(water + curr->waterStored - curr->waterCapacity);
          } else {
               curr->waterStored += water;
          }

          currTrip->freeWells.erase(currTrip->freeWells.begin() + i);
     }
}

int64_t binarySearchBucket(Trip* currTrip, int64_t x, int64_t l, int64_t h){
     if (currTrip->buckets.empty()){ return 0; }
     if (h <= l){
          return ((currTrip->buckets.at(l).at(1) > x)? l : l + 1);
     }

     int64_t mid = (l + h) / 2;

     if (currTrip->buckets.at(mid).at(1) == x || (currTrip->buckets.at(mid).at(1) <= x && x <= currTrip->buckets.at(mid + 1).at(1))){
          return mid + 1;
     }
     if (x < currTrip->buckets.at(mid).at(1)){ return binarySearchBucket(currTrip, x, l, mid - 1); }
     return binarySearchBucket(currTrip, x, mid + 1, h);
}

void insertBucket(Trip* currTrip, std::vector<int64_t> bucket){
     int64_t index = binarySearchBucket(currTrip, bucket.at(1), 0, currTrip->buckets.size() - 1);
     std::vector<std::vector<int64_t>> frontBuckets = {};
     std::vector<std::vector<int64_t>> endBuckets = {bucket};

     if (index == 0){
          std::copy(currTrip->buckets.begin(), currTrip->buckets.end(), std::back_inserter(endBuckets));
          currTrip->buckets = endBuckets;
          return;
     }
     if (index == currTrip->buckets.size()){
          currTrip->buckets.push_back(bucket);
          return;
     }

     std::copy(currTrip->buckets.begin(), currTrip->buckets.begin() + index, std::back_inserter(frontBuckets));
     std::copy(currTrip->buckets.begin() + index, currTrip->buckets.end(), std::back_inserter(endBuckets));

     std::copy(endBuckets.begin(), endBuckets.end(), std::back_inserter(frontBuckets));
     currTrip->buckets = frontBuckets;
}

int64_t purchaseBuckets(CurrentConfig* curr, Trip* currTrip, int64_t currentCost, int64_t startIndex){
     for (int64_t i = startIndex; i >= 0; i--){
          std::vector<int64_t> bucket = currTrip->buckets.at(i);
          if (curr->waterCapacity == curr->waterGoal){ break; }
          if (curr->allowance - currentCost < bucket.at(1)){ continue; }

          if (curr->waterCapacity + bucket.at(0) > curr->waterGoal){
               int64_t currWaterCapacity = curr->waterCapacity;
               int64_t laterCosts = purchaseBuckets(curr, currTrip, currentCost, i-1);

               if (currentCost != laterCosts && curr->waterCapacity < curr->waterGoal){
                    currTrip->boughtBuckets.pop_back();
                    curr->waterCapacity = currWaterCapacity;
               } else { return laterCosts; }

               if (currWaterCapacity == curr->waterCapacity){
                    currTrip->boughtBuckets.push_back(bucket);
                    curr->waterCapacity += bucket.at(0);

                    return currentCost + bucket.at(1);
               }

               if (curr->waterCapacity < curr->waterGoal){
                    currTrip->boughtBuckets.pop_back();
                    curr->waterCapacity = currWaterCapacity;
               } else { return laterCosts; }
          }

          currTrip->boughtBuckets.push_back(bucket);
          currentCost += bucket.at(1);
          curr->waterCapacity += bucket.at(0);

          currTrip->buckets.erase(currTrip->buckets.begin() + i);
          if (curr->waterCapacity >= curr->waterGoal){ break; }

          currentCost = purchaseBuckets(curr, currTrip, currentCost, i-1);
          i = (i >= currTrip->buckets.size())? currTrip->buckets.size() - 1 : i -1;

          if (curr->waterCapacity >= curr->waterGoal){ break; }
     }

     return currentCost;
}

void setupVillage(Trip* currTrip, Village* currVill, std::string line){
     std::stringstream ss(line);
     std::string xStr;

     if (!currVill->storedExchange){
          std::vector<int64_t>* exchange = new std::vector<int64_t>({});

          while (getline(ss, xStr, ' ')){
               int64_t x = std::stoll(xStr);
               exchange->push_back(x);
          }

          if (exchange->size() == 3){
               insertExchange(currTrip, exchange);
          } else {
               delete exchange;
          }

          currVill->storedExchange = true;
          return;
     }

     if (line.find('B') != std::string::npos){
          return;
     }
     if (line.find('W') != std::string::npos){
          currVill->storingWells = true;
          return;
     }

     if (!currVill->storingWells){
          std::vector<int64_t> bucket = {};

          while (getline(ss, xStr, ' ')){
               int64_t x = std::stoll(xStr);
               bucket.push_back(x);
          }

          insertBucket(currTrip, bucket);
          currVill->bucketsToStore--;

          return;
     }

     std::vector<int64_t> well = {};

     while (getline(ss, xStr, ' ')){
          int64_t x = std::stoll(xStr);
          well.push_back(x);
     }

     if (well.at(1) == 0){
          currTrip->freeWells.push_back(well.at(0));
     } else {
          insertWell(currTrip, well);
     }
}

void setupBuckets(CurrentConfig* curr, std::string line){
     std::stringstream ss(line);
     std::string xStr;

     while (getline(ss, xStr, ' ')){
          int64_t x = std::stoll(xStr);
          curr->buckets.push_back(x);
          curr->waterCapacity += x;
     }
}

void setupConfig(CurrentConfig* curr, std::string line){
     std::stringstream ss(line);
     std::string xStr;

     while (getline(ss, xStr, ' ')){
          int64_t x = std::stoll(xStr);
          if (curr->waterGoal == -1){ curr->waterGoal = x; continue; }
          if (curr->allowance == -1){ curr->allowance = x; continue; }
          curr->villagesLeft = x;
     }
}

int main(){
     std::ifstream dataFile("data.txt");
     std::string line;
     int64_t lineNum = 0;
     int64_t lineAfterTrip = 0;

     std::string totalResult = "";
     int64_t maxTrips = 0;
     Trip* currTrip = {};

     CurrentConfig* curr = new CurrentConfig();
     Village* village = new Village();

     if (!dataFile.is_open()){
          std::cerr << "Data file could not be opened!";
     }

     while (std::getline(dataFile, line)){
          lineNum++;
          lineAfterTrip++;
          if (lineNum == 1){ maxTrips = std::stoll(line); continue; }
          if (line.empty()){ continue; }

          if (line.find('T') != std::string::npos){
               currTrip = new Trip();
               curr = new CurrentConfig();

               Trips.push_back(currTrip);
               currTrip->currConfig = curr;
               lineAfterTrip = 0;

               continue;
          }

          if (lineAfterTrip == 1){ setupConfig(curr, line); continue; }
          if (lineAfterTrip == 2){ setupBuckets(curr, line); continue; }

          if (line.find('V') != std::string::npos){
               village = new Village();
               continue;
          }

          setupVillage(currTrip, village, line);
     }

     for (int i = 0; i < Trips.size(); i++){
          Trip* currTrip = Trips.at(i);
          curr = currTrip->currConfig;

          int64_t totalCost = purchaseBuckets(curr, currTrip, 0, currTrip->buckets.size() - 1);
          curr->allowance -= totalCost;

          while (curr->waterGoal > curr->waterCapacity){
               int64_t waterPurchase, totalGain;

               getFreeWater(curr, currTrip);

               waterPurchase = purchaseWells(curr, currTrip, 0, currTrip->paidWells.size() - 1);
               totalGain = purchaseExchanges(curr, currTrip, 0, currTrip->exchanges.size() - 1);
               if (totalGain == 0){ break; }

               curr->allowance += totalGain;

               totalCost = purchaseBuckets(curr, currTrip, 0, currTrip->buckets.size() - 1);
               curr->allowance -= totalCost;
          }
          if (curr->allowance < 0 || curr->waterGoal > curr->waterCapacity){
               totalResult += "0";
               continue;
          }

          totalCost = purchaseWells(curr, currTrip, 0, currTrip->paidWells.size() - 1);
          curr->allowance -= totalCost;

          while (curr->waterGoal > curr->waterStored){
               int64_t totalGain;

               getFreeWater(curr, currTrip);

               totalGain = purchaseExchanges(curr, currTrip, 0, currTrip->exchanges.size() - 1);
               if (totalGain == 0){ break; }

               curr->allowance += totalGain;
               totalCost = purchaseWells(curr, currTrip, 0, currTrip->paidWells.size() - 1);
               curr->allowance -= totalCost;
          }

          totalResult = totalResult + ((curr->waterStored >= curr->waterGoal)? "1" : "0");
     }

     std::cout<<totalResult;

     return 0;
}
