#!/bin/bash

# Order Import Script
# This script helps to import order export files into DynamoDB

# Change to the script directory
cd "$(dirname "$0")"

# Default values
ORDER_EXPORTS_PATH="./order_exports"
PATTERN="*.csv"
BATCH_SIZE=25
RETRIES=5
LOG_PROGRESS=true

# Display usage information
function show_usage {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --help                Show this help message"
  echo "  --path=DIRECTORY      Path to directory containing order export files (default: $ORDER_EXPORTS_PATH)"
  echo "  --pattern=PATTERN     File pattern to match (default: $PATTERN)"
  echo "  --batch-size=SIZE     Number of items to process in each batch (default: $BATCH_SIZE)"
  echo "  --retries=NUM         Maximum number of retries for failed operations (default: $RETRIES)"
  echo "  --log=true|false      Enable/disable detailed progress logging (default: $LOG_PROGRESS)"
  echo ""
  echo "Example: $0 --path=./my_orders --pattern=order_export_*.csv --batch-size=10"
}

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --help)
      show_usage
      exit 0
      ;;
    --path=*)
      ORDER_EXPORTS_PATH="${arg#*=}"
      shift
      ;;
    --pattern=*)
      PATTERN="${arg#*=}"
      shift
      ;;
    --batch-size=*)
      BATCH_SIZE="${arg#*=}"
      shift
      ;;
    --retries=*)
      RETRIES="${arg#*=}"
      shift
      ;;
    --log=*)
      LOG_PROGRESS="${arg#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $arg"
      show_usage
      exit 1
      ;;
  esac
done

# Check if the directory exists
if [ ! -d "$ORDER_EXPORTS_PATH" ]; then
  echo "Error: Directory $ORDER_EXPORTS_PATH does not exist."
  echo "Please create the directory and place your order export CSV files there, or specify a different path."
  exit 1
fi

# Set environment variables
export ORDER_EXPORTS_PATH="$ORDER_EXPORTS_PATH"

echo "=========================="
echo "Order Import Configuration"
echo "=========================="
echo "- Order exports path: $ORDER_EXPORTS_PATH"
echo "- File pattern: $PATTERN"
echo "- Batch size: $BATCH_SIZE"
echo "- Max retries: $RETRIES"
echo "- Detailed logging: $LOG_PROGRESS"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to run this script."
  exit 1
fi

# Confirm before proceeding
read -p "Do you want to proceed with the import? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Import cancelled."
  exit 0
fi

echo "Starting import process..."
echo "This may take a while depending on the number of files and records."

# Run the import process
node processOrderFiles.js \
  --path="$ORDER_EXPORTS_PATH" \
  --pattern="$PATTERN" \
  --batch-size="$BATCH_SIZE" \
  --retries="$RETRIES" \
  --log="$LOG_PROGRESS"

# Check exit status
if [ $? -eq 0 ]; then
  echo "Import process completed successfully!"
else
  echo "Import process encountered errors. Check the logs for details."
  exit 1
fi 