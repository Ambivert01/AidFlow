export class ApiResponse {
  static success(data = null, message = "Success") {
    return {
      success: true,
      message,
      data,
    };
  }

  static created(data = null, message = "Created successfully") {
    return {
      success: true,
      message,
      data,
    };
  }

  static updated(data = null, message = "Updated successfully") {
    return {
      success: true,
      message,
      data,
    };
  }

  static deleted(message = "Deleted successfully") {
    return {
      success: true,
      message,
      data: null,
    };
  }

  static paginated(data, pagination) {
    return {
      success: true,
      message: "Fetched successfully",

      data,

      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        pages: pagination.pages,
      },
    };
  }
}
