# Calcucom Android KMP Dashboard App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fully functional Kotlin Multiplatform (KMP) Android application porting the marketplace commission fee and profit dashboard from the web application.

**Architecture:** A KMP multi-module project comprising a `:shared` module (holding the business logic, formulas, data models, and platform rates) and an `:app` module (implementing a beautiful Jetpack Compose Material 3 UI for Android).

**Tech Stack:** Kotlin 2.2.21, Jetpack Compose, Material 3, Gradle 9.3.1.

---

## File Structure

- New Root Project Directory: `calcucom-android/`
- Root config:
  - `calcucom-android/settings.gradle.kts`
  - `calcucom-android/build.gradle.kts`
- Shared module:
  - `calcucom-android/shared/build.gradle.kts`
  - `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/model/Models.kt`
  - `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/constants/AppConstants.kt`
  - `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/engine/PricingEngine.kt`
  - `calcucom-android/shared/src/commonTest/kotlin/com/calcucom/shared/engine/PricingEngineTest.kt`
- Android app module:
  - `calcucom-android/app/build.gradle.kts`
  - `calcucom-android/app/src/main/AndroidManifest.xml`
  - `calcucom-android/app/src/main/java/com/calcucom/android/MainActivity.kt`
  - `calcucom-android/app/src/main/java/com/calcucom/android/ui/MainDashboardScreen.kt`
  - `calcucom-android/app/src/main/java/com/calcucom/android/ui/ProfitCalculatorTab.kt`
  - `calcucom-android/app/src/main/java/com/calcucom/android/ui/PriceFinderTab.kt`
  - `calcucom-android/app/src/main/java/com/calcucom/android/ui/BundlingTab.kt`
  - `calcucom-android/app/src/main/java/com/calcucom/android/ui/AdsRoasTab.kt`
  - `calcucom-android/app/src/main/java/com/calcucom/android/ui/RecipeTab.kt`

---

## Tasks

### Task 1: Scaffold Initial Android Project

**Files:**
- Create: `calcucom-android/` skeleton using the `android create` command.

- [ ] **Step 1: Run the project creation command**
  Run: `android create empty-activity --name="Calcucom" -o calcucom-android`
  Expected: Scaffolds the template project inside `calcucom-android`.

- [ ] **Step 2: Commit initial scaffold**
  Run: `git add calcucom-android && git commit -m "chore: scaffold initial Android project"`

---

### Task 2: Configure Kotlin Multiplatform (KMP) Module Structure

**Files:**
- Modify: `calcucom-android/settings.gradle.kts` to include the shared module.
- Create: `calcucom-android/shared/build.gradle.kts` for the KMP module configuration.
- Modify: `calcucom-android/app/build.gradle.kts` to depend on the shared module.

- [ ] **Step 1: Modify settings.gradle.kts to register ':shared'**
  Update `calcucom-android/settings.gradle.kts`:
  ```kotlin
  pluginManagement {
      repositories {
          google {
              content {
                  includeGroupByRegex("com\\.android.*")
                  includeGroupByRegex("com\\.google.*")
                  includeGroupByRegex("androidx.*")
              }
          }
          mavenCentral()
          gradlePluginPortal()
      }
  }
  dependencyResolutionManagement {
      repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
      repositories {
          google()
          mavenCentral()
      }
  }
  rootProject.name = "Calcucom"
  include(":app")
  include(":shared")
  ```

- [ ] **Step 2: Create shared/build.gradle.kts**
  Write to `calcucom-android/shared/build.gradle.kts`:
  ```kotlin
  plugins {
      kotlin("multiplatform") version "2.2.21"
      id("com.android.library") version "9.0.0-alpha01"
  }

  kotlin {
      androidTarget {
          compilerOptions {
              jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
          }
      }
      sourceSets {
          commonMain.dependencies {
              // Add any common dependencies here
          }
          commonTest.dependencies {
              implementation(kotlin("test"))
          }
      }
  }

  android {
      namespace = "com.calcucom.shared"
      compileSdk = 35
      defaultConfig {
          minSdk = 24
      }
  }
  ```

- [ ] **Step 3: Update app/build.gradle.kts to include shared dependency**
  Add `implementation(project(":shared"))` to dependencies in `calcucom-android/app/build.gradle.kts`.

- [ ] **Step 4: Verify the multi-module project configuration compiles**
  Run: `./gradlew :shared:assembleDebug` in `calcucom-android/`
  Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit configuration**
  Run: `git add calcucom-android && git commit -m "chore: configure KMP multi-module structure"`

---

### Task 3: Port Data Models and Constants to Kotlin

**Files:**
- Create: `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/model/Models.kt`
- Create: `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/constants/AppConstants.kt`

- [ ] **Step 1: Write Data Models to Models.kt**
  Write `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/model/Models.kt`:
  ```kotlin
  package com.calcucom.shared.model

  data class Product(
      val id: Int,
      val name: String,
      val price: Double,
      val hpp: Double,
      val qty: Int = 1,
      val discountPercent: Double = 0.0
  )

  data class CustomCost(
      val name: String,
      val amount: Double,
      val isPercent: Boolean,
      val category: String // "deduction" or "addition"
  )

  data class FeeResult(
      val platform: String,
      val sellingPrice: Double,
      val displayPrice: Double,
      val basis: Double,
      val hpp: Double,
      val adminRate: Double,
      val adminFee: Double,
      val serviceFee: Double,
      val freeShipFee: Double,
      val cashbackFee: Double,
      val affiliateFee: Double,
      val orderProcessFee: Double,
      val fixedFee: Double,
      val operationalCost: Double,
      val adsCost: Double,
      val customDeductions: Double,
      val customAdditions: Double,
      val marketplaceDeductions: Double,
      val totalDeductions: Double,
      val totalFixedFees: Double,
      val totalCost: Double,
      val netIncome: Double,
      val netProfit: Double,
      val margin: Double,
      val isHealthy: Boolean,
      val healthLevel: String // "excellent", "good", "fair", "low", "negative"
  )

  data class BundleResult(
      val bundlePrice: Double,
      val totalHPP: Double,
      val totalItems: Int,
      val productCount: Int,
      val voucherAmount: Double,
      val adminFee: Double,
      val serviceFee: Double,
      val cashbackFee: Double,
      val processFee: Double,
      val fixedFee: Double,
      val totalFees: Double,
      val netCash: Double,
      val netProfit: Double,
      val margin: Double,
      val marginStatus: String, // "danger", "warning", "healthy"
      val products: List<BundleProductBreakdown>,
      val individualProfit: Double,
      val profitDifference: Double,
      val profitDifferencePercent: Double,
      val isBundleBetter: Boolean,
      val allocationMode: String
  )

  data class BundleProductBreakdown(
      val product: Product,
      val allocatedFee: Double,
      val allocatedProfit: Double,
      val profitShare: Double,
      val margin: Double,
      val marginStatus: String,
      val hppRatio: Double
  )

  data class RoasResult(
      val roasBE: Double,
      val acosMax: Double,
      val maxCPC: Double,
      val conversionRate: Double
  )

  data class AdPerformanceResult(
      val cpc: Double,
      val acos: Double,
      val roas: Double,
      val grossProfit: Double,
      val profitAfterAds: Double,
      val marginAfterAds: Double,
      val breakEvenRoas: Double,
      val status: String, // "excellent", "good", "warning", "danger", "unknown"
      val recommendation: String
  )
  ```

- [ ] **Step 2: Write Marketplace constants to AppConstants.kt**
  Port Shopee, Tokopedia, TikTok, and Lazada rate rules into `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/constants/AppConstants.kt`:
  ```kotlin
  package com.calcucom.shared.constants

  object AppConstants {
      // Shopee Rates by [sellerType][categoryGroup]
      val shopeeRates = mapOf(
          "nonstar" to mapOf("A" to 8.0, "B" to 7.5, "C" to 6.5, "D" to 5.5, "E" to 4.5, "F" to 4.0),
          "star" to mapOf("A" to 8.5, "B" to 8.0, "C" to 7.0, "D" to 6.0, "E" to 5.0, "F" to 4.5),
          "mall" to mapOf("A" to 9.5, "B" to 9.0, "C" to 8.0, "D" to 7.0, "E" to 6.0, "F" to 5.5)
      )

      // Tokopedia Rates by [sellerType][categoryGroup]
      val tokopediaRates = mapOf(
          "regular" to mapOf("A" to 6.5, "B" to 5.5, "C" to 4.5, "D" to 3.5, "E" to 2.5, "F" to 2.0),
          "power" to mapOf("A" to 7.5, "B" to 6.5, "C" to 5.5, "D" to 4.5, "E" to 3.5, "F" to 3.0),
          "mall" to mapOf("A" to 8.5, "B" to 7.5, "C" to 6.5, "D" to 5.5, "E" to 4.5, "F" to 4.0)
      )

      // TikTok Rates
      val tiktokRates = mapOf(
          "regular" to mapOf("A" to 6.0, "B" to 5.0, "C" to 4.0, "D" to 3.0, "E" to 2.0, "F" to 1.5),
          "mall" to mapOf("A" to 8.0, "B" to 7.0, "C" to 6.0, "D" to 5.0, "E" to 4.0, "F" to 3.5)
      )

      // Lazada Rates
      val lazadaRates = mapOf(
          "regular" to mapOf("A" to 5.0, "B" to 4.5, "C" to 4.0, "D" to 3.0, "E" to 2.0, "F" to 1.5),
          "mall" to mapOf("A" to 7.0, "B" to 6.5, "C" to 6.0, "D" to 5.0, "E" to 4.0, "F" to 3.5)
      )
  }
  ```

- [ ] **Step 3: Commit Models & Constants**
  Run: `git add calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/model/Models.kt calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/constants/AppConstants.kt && git commit -m "feat: add shared KMP data models and constants"`

---

### Task 4: Port Pricing Engine Logic to Kotlin

**Files:**
- Create: `calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/engine/PricingEngine.kt`
- Create: `calcucom-android/shared/src/commonTest/kotlin/com/calcucom/shared/engine/PricingEngineTest.kt`

- [ ] **Step 1: Write PricingEngine.kt**
  Write calculations matching JS engine precisely.
  (Implement methods: `calculateFees`, `calculateOptimalPrice`, `calculateROAS`, `analyzeAdPerformance`, `calculateBundle`).
  
- [ ] **Step 2: Write PricingEngineTest.kt**
  Write unit tests to verify single profit, optimal price, ROAS, and bundle fee allocations.

- [ ] **Step 3: Run shared unit tests**
  Run: `./gradlew :shared:test` in `calcucom-android/`
  Expected: tests PASS.

- [ ] **Step 4: Commit PricingEngine**
  Run: `git add calcucom-android/shared/src/commonMain/kotlin/com/calcucom/shared/engine/PricingEngine.kt calcucom-android/shared/src/commonTest/kotlin/com/calcucom/shared/engine/PricingEngineTest.kt && git commit -m "feat: implement and test ported PricingEngine in Kotlin"`

---

### Task 5: Implement UI Dashboard Shell & Tab Navigation

**Files:**
- Create: `calcucom-android/app/src/main/java/com/calcucom/android/ui/MainDashboardScreen.kt`
- Modify: `calcucom-android/app/src/main/java/com/calcucom/android/MainActivity.kt`

- [ ] **Step 1: Write MainDashboardScreen.kt**
  Define navigation tabs using Compose Material 3:
  - Profit Calculator
  - Price Finder
  - Bundling
  - ROAS & Ads
  - Recipe HPP

- [ ] **Step 2: Update MainActivity.kt to render MainDashboardScreen**
  Set content to Calcucom Dashboard UI theme.

- [ ] **Step 3: Commit UI Navigation setup**
  Run: `git add calcucom-android/app/src/main/java/com/calcucom/android/ui/MainDashboardScreen.kt calcucom-android/app/src/main/java/com/calcucom/android/MainActivity.kt && git commit -m "feat: implement Android dashboard navigation and tabs"`

---

### Task 6: Implement Calculator UI Tabs

**Files:**
- Create: `calcucom-android/app/src/main/java/com/calcucom/android/ui/ProfitCalculatorTab.kt`
- Create: `calcucom-android/app/src/main/java/com/calcucom/android/ui/PriceFinderTab.kt`
- Create: `calcucom-android/app/src/main/java/com/calcucom/android/ui/BundlingTab.kt`
- Create: `calcucom-android/app/src/main/java/com/calcucom/android/ui/AdsRoasTab.kt`
- Create: `calcucom-android/app/src/main/java/com/calcucom/android/ui/RecipeTab.kt`

- [ ] **Step 1: Write ProfitCalculatorTab.kt**
  Input fields: selling price, HPP, discount, platform, seller type, categories, programs. Output cards: total admin fee, cashback fee, service fee, net cash, margin, status color.

- [ ] **Step 2: Write PriceFinderTab.kt**
  Inputs: HPP, target margin / profit amount, total fee percent, fixed costs. Outputs suggested optimal price.

- [ ] **Step 3: Write BundlingTab.kt**
  Dynamic item adding, allocating bundle fees, showing business insights cards.

- [ ] **Step 4: Write AdsRoasTab.kt**
  Ads analyzer and ROAS helper inputs and displays.

- [ ] **Step 5: Write RecipeTab.kt**
  List of ingredients with raw material unit conversions, computing final recipe HPP.

- [ ] **Step 6: Run full Gradle assemble build to verify compilation**
  Run: `./gradlew assembleDebug`
  Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit UI Tabs**
  Run: `git add calcucom-android/app/src/main/java/com/calcucom/android/ui/*.kt && git commit -m "feat: complete UI screens for all dashboard calculator tabs"`

---

### Task 7: Build and Verify on Device/Emulator

**Files:**
- Verify: Gradle APK output.

- [ ] **Step 1: Build the Debug APK**
  Run: `./gradlew assembleDebug`
  Expected: Successful compilation, producing `app-debug.apk` in `calcucom-android/app/build/outputs/apk/debug/`.

- [ ] **Step 2: Start Emulator and Deploy**
  Run: `android emulator start Medium_Phone_API_36.1`
  Then: `android run --apks=calcucom-android/app/build/outputs/apk/debug/app-debug.apk`
  Expected: The app starts successfully on the emulator.

- [ ] **Step 3: Capture screenshot of the running app**
  Run: `android screen capture docs/superpowers/specs/dashboard-screenshot.png`
  Expected: Screenshot of MainDashboardScreen saved.

- [ ] **Step 4: Commit final verifications and screenshot**
  Run: `git add docs/superpowers/specs/dashboard-screenshot.png && git commit -m "test: verify build and capture emulator screenshot"`
